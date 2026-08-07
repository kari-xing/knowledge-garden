"""混合检索：全文(ILIKE) + 语义(向量) + RRF 融合。"""
import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.deps import get_current_user
from app.models.note import Note
from app.models.tag import Tag
from app.models.user import User
from app.schemas.common import ok
from app.schemas.note import NoteOut
from app.schemas.search import SearchHitOut, SearchResultOut
from app.utils import make_snippet

router = APIRouter(prefix="/search", tags=["检索"])

RRF_K = 60


def _vector_store():
    try:
        from app.vector.factory import get_vector_store

        return get_vector_store()
    except Exception:
        return None


async def _lexical(db, user_id, q, tag, page, page_size):
    stmt = select(Note).where(Note.user_id == user_id)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(or_(Note.title.ilike(like), Note.content.ilike(like)))
    if tag:
        stmt = stmt.where(Note.tags.any(Tag.name == tag))
    total = await db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    rows = await db.scalars(
        stmt.options(selectinload(Note.tags))
        .order_by(Note.updated_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    items = []
    for note in rows:
        matched = []
        if q:
            lower_q = q.lower()
            if (note.title or "").lower().find(lower_q) >= 0:
                matched.append("title")
            if note.content.lower().find(lower_q) >= 0:
                matched.append("content")
        score = 0.6 if "title" in matched else 0.4 if "content" in matched else 0.2
        items.append(
            SearchHitOut(
                note=NoteOut.model_validate(note),
                score=score,
                matched_fields=matched,
                snippet=make_snippet(note.content, q),
            )
        )
    return items, total


async def _semantic(db, user_id, q, tag, page, page_size):
    store = _vector_store()
    if store is None:
        return [], 0
    try:
        hits = await store.query(
            q, top_k=page_size * 3, where={"user_id": str(user_id)}
        )
    except Exception:
        return [], 0
    ids = [uuid.UUID(h.note_id) for h in hits]
    if not ids:
        return [], 0
    stmt = select(Note).where(Note.user_id == user_id, Note.id.in_(ids))
    if tag:
        stmt = stmt.where(Note.tags.any(Tag.name == tag))
    notes = await db.scalars(stmt.options(selectinload(Note.tags)))
    note_map = {n.id: n for n in notes}
    items = []
    for hit in hits:
        note = note_map.get(uuid.UUID(hit.note_id))
        if note is None:
            continue
        items.append(
            SearchHitOut(
                note=NoteOut.model_validate(note),
                score=hit.score,
                matched_fields=["semantic"],
                snippet=make_snippet(note.content, q),
            )
        )
    return items, len(items)


@router.get("")
async def search(
    q: str = Query(..., min_length=1),
    tag: str | None = None,
    engine: str = Query("mixed"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if engine == "lexical":
        items, total = await _lexical(db, user.id, q, tag, page, page_size)
        return ok(SearchResultOut(items=items, total=total))
    if engine == "semantic":
        items, total = await _semantic(db, user.id, q, tag, page, page_size)
        return ok(SearchResultOut(items=items, total=total))

    # mixed：RRF 融合
    lex_items, _ = await _lexical(db, user.id, q, tag, 1, page_size * 2)
    sem_items, _ = await _semantic(db, user.id, q, tag, 1, page_size * 2)
    merged: dict[uuid.UUID, dict] = {}
    for rank, hit in enumerate(lex_items, start=1):
        entry = merged.setdefault(
            hit.note.id,
            {"note": hit.note, "score": 0.0, "fields": set(), "snippet": hit.snippet},
        )
        entry["score"] += 1 / (RRF_K + rank)
        entry["fields"].update(hit.matched_fields)
    for rank, hit in enumerate(sem_items, start=1):
        entry = merged.setdefault(
            hit.note.id,
            {"note": hit.note, "score": 0.0, "fields": set(), "snippet": hit.snippet},
        )
        entry["score"] += 1 / (RRF_K + rank)
        entry["fields"].update(hit.matched_fields)
    ranked = sorted(merged.values(), key=lambda x: x["score"], reverse=True)[:page_size]
    items = [
        SearchHitOut(
            note=NoteOut.model_validate(e["note"]),
            score=e["score"],
            matched_fields=sorted(e["fields"]),
            snippet=e["snippet"],
        )
        for e in ranked
    ]
    return ok(SearchResultOut(items=items, total=len(items)))
