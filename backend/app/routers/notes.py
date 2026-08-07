"""笔记 CRUD / 重新处理 / 复习。"""
import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.deps import get_current_user
from app.models.ai_job import AiJob
from app.models.note import Note
from app.models.relation import NoteRelation
from app.models.tag import Tag
from app.models.user import User
from app.schemas.common import Page, ok
from app.schemas.note import (
    NoteCreate,
    NoteCreateOut,
    NoteDetailOut,
    NoteOut,
    NoteUpdate,
    RelatedNoteOut,
    ReprocessResult,
    ReviewInfoOut,
)
from app.schemas.review import ReviewRequest, ReviewResponse
from app.services.ai_pipeline import process_note
from app.services.review_service import apply_review, get_schedule
from app.services.stats_service import recalc_stats
from app.services.tag_service import resolve_tags, sync_note_tags

router = APIRouter(prefix="/notes", tags=["笔记"])


def _vector_store():
    try:
        from app.vector.factory import get_vector_store

        return get_vector_store()
    except Exception:
        return None


@router.get("")
async def list_notes(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: str | None = None,
    tag: str | None = None,
    q: str | None = None,
):
    stmt = select(Note).where(Note.user_id == user.id)
    if status:
        stmt = stmt.where(Note.status == status)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(or_(Note.title.ilike(like), Note.content.ilike(like)))
    if tag:
        stmt = stmt.where(Note.tags.any(Tag.name == tag))
    total = await db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    rows = await db.scalars(
        stmt.options(selectinload(Note.tags))
        .order_by(Note.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    items = [NoteOut.model_validate(n) for n in rows]
    return ok(Page(items=items, total=total, page=page, page_size=page_size))


@router.post("", status_code=201)
async def create_note(
    body: NoteCreate,
    background: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    tags: list[Tag] = []
    if body.tags:
        tags = await resolve_tags(db, user.id, body.tags)
    note = Note(
        user_id=user.id,
        title=body.title,
        content=body.content,
        summary=body.summary,
        status="seed",
        processing_status="pending",
        tags=tags,
    )
    db.add(note)
    await db.flush()
    job = AiJob(note_id=note.id, user_id=user.id, status="pending")
    db.add(job)
    await db.commit()
    await db.refresh(note)
    background.add_task(process_note, note.id, user.id, "pipeline")
    return ok(
        NoteCreateOut(
            id=note.id,
            status=note.status,
            processing_status=note.processing_status,
            job_id=job.id,
            message="笔记已创建，AI 正在处理中",
        )
    )


@router.get("/{note_id}")
async def get_note_detail(
    note_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    note = await db.scalar(
        select(Note)
        .where(Note.id == note_id, Note.user_id == user.id)
        .options(selectinload(Note.tags))
    )
    if note is None:
        raise HTTPException(status_code=404, detail="笔记不存在")

    related: list[RelatedNoteOut] = []
    rels = await db.scalars(
        select(NoteRelation).where(
            NoteRelation.user_id == user.id,
            or_(
                NoteRelation.source_note_id == note.id,
                NoteRelation.target_note_id == note.id,
            ),
        )
    )
    other_ids = []
    for r in rels:
        other_id = (
            r.target_note_id if r.source_note_id == note.id else r.source_note_id
        )
        other_ids.append((other_id, r.similarity_score, r.relation_reason))
    if other_ids:
        others = await db.scalars(
            select(Note).where(Note.id.in_([x[0] for x in other_ids]))
        )
        other_map = {n.id: n for n in others}
        for other_id, sim, reason in other_ids:
            other = other_map.get(other_id)
            if other is not None:
                related.append(
                    RelatedNoteOut(
                        id=other.id, title=other.title, similarity=sim, reason=reason
                    )
                )
    related.sort(key=lambda x: x.similarity, reverse=True)

    review = None
    schedule = await get_schedule(db, note.id)
    if schedule is not None:
        review = ReviewInfoOut(
            stage=schedule.review_stage, next_review_date=schedule.next_review_date
        )
    return ok(NoteDetailOut(note=NoteOut.model_validate(note), related=related, review=review))


@router.put("/{note_id}")
async def update_note(
    note_id: uuid.UUID,
    body: NoteUpdate,
    background: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    note = await db.scalar(
        select(Note)
        .where(Note.id == note_id, Note.user_id == user.id)
        .options(selectinload(Note.tags))
    )
    if note is None:
        raise HTTPException(status_code=404, detail="笔记不存在")
    if body.title is not None:
        note.title = body.title
    if body.content is not None:
        note.content = body.content
    if body.summary is not None:
        note.summary = body.summary
    if body.tags is not None:
        await sync_note_tags(db, note, body.tags)
    if body.reprocess:
        note.processing_status = "pending"
        job = AiJob(note_id=note.id, user_id=user.id, job_type="regenerate", status="pending")
        db.add(job)
        await db.flush()
        background.add_task(process_note, note.id, user.id, "regenerate")
    await db.commit()
    note = await db.scalar(
        select(Note).where(Note.id == note_id).options(selectinload(Note.tags))
    )
    return ok(NoteOut.model_validate(note))


@router.delete("/{note_id}")
async def delete_note(
    note_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    note = await db.scalar(
        select(Note)
        .where(Note.id == note_id, Note.user_id == user.id)
        .options(selectinload(Note.tags))
    )
    if note is None:
        raise HTTPException(status_code=404, detail="笔记不存在")
    store = _vector_store()
    if store is not None:
        try:
            await store.delete(str(note.id))
        except Exception:
            pass
    await db.delete(note)
    await db.commit()
    await recalc_stats(db, user.id)
    await db.commit()
    return ok(None)


@router.post("/{note_id}/reprocess")
async def reprocess_note(
    note_id: uuid.UUID,
    background: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    note = await db.scalar(
        select(Note).where(Note.id == note_id, Note.user_id == user.id)
    )
    if note is None:
        raise HTTPException(status_code=404, detail="笔记不存在")
    note.processing_status = "pending"
    job = AiJob(note_id=note.id, user_id=user.id, job_type="regenerate", status="pending")
    db.add(job)
    await db.commit()
    background.add_task(process_note, note.id, user.id, "regenerate")
    return ok(
        ReprocessResult(
            id=note.id,
            status=note.status,
            processing_status="pending",
            job_id=job.id,
            message="已重新加入 AI 处理队列",
        )
    )


@router.post("/{note_id}/review")
async def review_note(
    note_id: uuid.UUID,
    body: ReviewRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    note = await db.scalar(
        select(Note).where(Note.id == note_id, Note.user_id == user.id)
    )
    if note is None:
        raise HTTPException(status_code=404, detail="笔记不存在")
    stage_after, next_date, status_after = await apply_review(db, user.id, note, body.result)
    return ok(
        ReviewResponse(
            stage_after=stage_after,
            next_review_date=next_date,
            status_after=status_after,
        )
    )
