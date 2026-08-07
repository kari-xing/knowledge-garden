"""AI 处理流水线：标题/标签/摘要/嵌入/关联（异步执行，任一步失败优雅降级）。"""
import uuid

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.config import settings
from app.database import SessionLocal
from app.models.ai_job import AiJob
from app.models.note import Note
from app.models.relation import NoteRelation
from app.services.stats_service import recalc_stats
from app.services.tag_service import resolve_tags
from app.utils import first_line, parse_json_list


def _get_llm():
    """获取 LLM Provider；不可用时返回 None（降级）。"""
    try:
        from app.llm.factory import get_llm

        return get_llm()
    except Exception:
        return None


def _get_vector_store():
    """获取向量存储；ChromaDB 不可用时返回 None（降级）。"""
    try:
        from app.vector.factory import get_vector_store

        return get_vector_store()
    except Exception:
        return None


async def process_note(note_id, user_id, job_type: str = "pipeline") -> None:
    """对单篇笔记执行 AI 流水线（独立会话，供 BackgroundTasks/调度器调用）。"""
    async with SessionLocal() as db:
        note = await db.scalar(
            select(Note).where(Note.id == note_id).options(selectinload(Note.tags))
        )
        if note is None:
            return

        job = AiJob(
            note_id=note.id,
            user_id=user_id,
            job_type=job_type,
            status="processing",
            pipeline_version=settings.PIPELINE_VERSION,
        )
        db.add(job)
        note.processing_status = "processing"
        await db.commit()

        llm = _get_llm()
        vector = _get_vector_store()
        try:
            await _run_pipeline(db, note, user_id, llm, vector)
            note.status = "growing"
            note.processing_status = "done"
            job.status = "done"
            await recalc_stats(db, user_id)
            await db.commit()
        except Exception as exc:  # noqa: BLE001 流水线失败不阻塞 CRUD
            note.processing_status = "failed"
            job.status = "failed"
            job.error_message = str(exc)[:500]
            await db.commit()

async def _run_pipeline(db, note, user_id, llm, vector) -> None:
    """①标题 ②标签 ③摘要 ④嵌入 ⑤相似 ⑥关联理由 ⑦写入关联。"""
    # ① 标题
    if not note.title or not note.title.strip():
        note.title = first_line(note.content)
        if llm is not None:
            try:
                raw = await llm.complete(
                    "为下面这篇笔记生成一个简洁的标题（不超过20字），只输出标题：\n"
                    f"{note.content[:1500]}"
                )
                title = (raw or "").strip().strip('"“”')
                if title:
                    note.title = title[:255]
            except Exception:
                pass

    # ② 标签
    tag_names: list[str] = []
    if llm is not None:
        try:
            raw = await llm.complete(
                "你是知识管理助手。根据下面的笔记，生成 3-5 个领域标签，只输出 JSON 数组。\n"
                f"标题：{note.title}\n摘要：{note.summary or ''}\n正文摘要：{note.content[:800]}",
                json_mode=True,
            )
            tag_names = parse_json_list(raw)
        except Exception:
            tag_names = []
    if tag_names:
        note.tags = await resolve_tags(db, user_id, tag_names[:8])

    # ③ 摘要
    if llm is not None and (not note.summary or not note.summary.strip()):
        try:
            raw = await llm.complete(
                f"用不超过50字的一句话概括这篇笔记的核心观点：\n标题：{note.title}\n正文前1500字：{note.content[:1500]}"
            )
            summary = (raw or "").strip().strip('"“”')
            if summary:
                note.summary = summary[:300]
        except Exception:
            pass

    # ④⑤ 向量检索相似笔记
    related: list[tuple[str, float]] = []
    if vector is not None:
        try:
            doc = f"{note.title or ''}\n{note.summary or ''}\n{note.content[:2000]}"
            hits = await vector.query(
                doc, top_k=settings.TOP_K, where={"user_id": str(user_id)}
            )
            for hit in hits:
                if hit.note_id == str(note.id):
                    continue
                if hit.score >= settings.SIMILARITY_THRESHOLD:
                    related.append((hit.note_id, hit.score))
        except Exception:
            related = []

    # ⑥⑦ 写入关联（无向去重 + LLM 理由）
    for target_id, score in related:
        try:
            target = await db.get(Note, uuid.UUID(target_id))
            if target is None:
                continue
            src, tgt = sorted([str(note.id), str(target.id)])
            exists = await db.scalar(
                select(NoteRelation).where(
                    NoteRelation.user_id == user_id,
                    NoteRelation.source_note_id == uuid.UUID(src),
                    NoteRelation.target_note_id == uuid.UUID(tgt),
                )
            )
            if exists is not None:
                continue
            reason = None
            if llm is not None:
                try:
                    reason = (
                        await llm.complete(
                            f"笔记A《{note.title}》：{note.summary or ''}\n"
                            f"笔记B《{target.title}》：{target.summary or ''}\n"
                            "请用一句话说明它们之间存在什么关联（不超过60字）。"
                        )
                    ).strip()[:200] or None
                except Exception:
                    reason = None
            db.add(
                NoteRelation(
                    user_id=user_id,
                    source_note_id=uuid.UUID(src),
                    target_note_id=uuid.UUID(tgt),
                    similarity_score=score,
                    relation_reason=reason,
                    source="auto",
                )
            )
        except Exception:
            continue

    # ⑧ 写入向量
    if vector is not None:
        try:
            await vector.upsert(
                str(note.id),
                f"{note.title or ''}\n{note.summary or ''}\n{note.content[:2000]}",
                {
                    "user_id": str(user_id),
                    "title": note.title or "",
                    "tags": ",".join(t.name for t in note.tags),
                    "status": note.status,
                },
            )
        except Exception:
            pass

