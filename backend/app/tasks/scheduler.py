"""后台定时任务：枯萎扫描 + 每日关联发现（向量库可用时）。"""
import asyncio
import uuid
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import func, select

from app.config import settings
from app.database import SessionLocal
from app.models.note import Note
from app.models.relation import NoteRelation
from app.models.user import User

SCHEDULER_INTERVAL = 3600  # 每秒轮询间隔（1 小时）


async def scan_wilted() -> int:
    """超过 WILT_DAYS 天未复习的笔记标记为枯萎，返回处理条数。"""
    threshold = datetime.now(timezone.utc) - timedelta(days=settings.WILT_DAYS)
    count = 0
    async with SessionLocal() as db:
        rows = await db.scalars(
            select(Note).where(
                Note.status.in_(["seed", "growing", "mature"]),
                Note.last_reviewed_at.isnot(None),
                Note.last_reviewed_at < threshold,
            )
        )
        for note in rows:
            note.status = "wilted"
            count += 1
        await db.commit()
    return count


async def discover_daily_relations() -> int:
    """每日关联发现：采样笔记向量检索建边（ChromaDB 不可用则跳过）。"""
    try:
        from app.vector.factory import get_vector_store

        store = get_vector_store()
    except Exception:
        return 0
    created = 0
    async with SessionLocal() as db:
        user_ids = await db.scalars(select(User.id))
        for uid in user_ids:
            try:
                sample = await db.scalars(
                    select(Note)
                    .where(Note.user_id == uid, Note.processing_status == "done")
                    .order_by(func.random())
                    .limit(20)
                )
                for note in sample:
                    hits = await store.query(
                        f"{note.title or ''}\n{note.summary or ''}",
                        top_k=settings.TOP_K,
                        where={"user_id": str(uid)},
                    )
                    for hit in hits:
                        if (
                            hit.note_id == str(note.id)
                            or hit.score < settings.SIMILARITY_THRESHOLD
                        ):
                            continue
                        src, tgt = sorted([str(note.id), hit.note_id])
                        exists = await db.scalar(
                            select(NoteRelation).where(
                                NoteRelation.user_id == uid,
                                NoteRelation.source_note_id == uuid.UUID(src),
                                NoteRelation.target_note_id == uuid.UUID(tgt),
                            )
                        )
                        if exists is None:
                            db.add(
                                NoteRelation(
                                    user_id=uid,
                                    source_note_id=uuid.UUID(src),
                                    target_note_id=uuid.UUID(tgt),
                                    similarity_score=hit.score,
                                    relation_reason=None,
                                    source="daily",
                                )
                            )
                            created += 1
                await db.commit()
            except Exception:
                await db.rollback()
    return created


async def scheduler_loop() -> None:
    """每小时扫描枯萎；每天执行一次关联发现。"""
    last_discovery: date | None = None
    while True:
        try:
            await scan_wilted()
        except Exception:
            pass
        try:
            today = date.today()
            if last_discovery != today:
                await discover_daily_relations()
                last_discovery = today
        except Exception:
            pass
        await asyncio.sleep(SCHEDULER_INTERVAL)
