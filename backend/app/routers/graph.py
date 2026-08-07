"""知识图谱：节点 / 边 / 最短路径。"""
import uuid
from collections import defaultdict, deque

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.deps import get_current_user
from app.models.note import Note
from app.models.relation import NoteRelation
from app.models.tag import Tag
from app.models.user import User
from app.schemas.common import ok
from app.schemas.graph import GraphLinkOut, GraphNodeOut, PathOut

router = APIRouter(prefix="/graph", tags=["图谱"])


@router.get("/nodes")
async def graph_nodes(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    tag: str | None = None,
    status: str | None = None,
):
    stmt = select(Note).where(Note.user_id == user.id)
    if status:
        stmt = stmt.where(Note.status == status)
    if tag:
        stmt = stmt.where(Note.tags.any(Tag.name == tag))
    notes = await db.scalars(stmt.options(selectinload(Note.tags)))

    src_counts = dict(
        (
            await db.execute(
                select(NoteRelation.source_note_id, func.count())
                .where(NoteRelation.user_id == user.id)
                .group_by(NoteRelation.source_note_id)
            )
        ).all()
    )
    tgt_counts = dict(
        (
            await db.execute(
                select(NoteRelation.target_note_id, func.count())
                .where(NoteRelation.user_id == user.id)
                .group_by(NoteRelation.target_note_id)
            )
        ).all()
    )
    items = []
    for note in notes:
        degree = int(src_counts.get(note.id, 0) + tgt_counts.get(note.id, 0))
        primary = note.tags[0] if note.tags else None
        items.append(
            GraphNodeOut(
                id=note.id,
                title=note.title,
                status=note.status,
                tags=[t.name for t in note.tags],
                color=primary.color if primary else None,
                summary=note.summary,
                degree=degree,
            )
        )
    return ok(items)


@router.get("/links")
async def graph_links(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    rels = await db.scalars(
        select(NoteRelation).where(NoteRelation.user_id == user.id)
    )
    items = [
        GraphLinkOut(
            source=r.source_note_id,
            target=r.target_note_id,
            similarity_score=r.similarity_score,
            reason=r.relation_reason,
        )
        for r in rels
    ]
    return ok(items)


@router.get("/path")
async def graph_path(
    source: uuid.UUID,
    target: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if source == target:
        return ok(PathOut(nodes=[], links=[], distance=0.0))
    rels = await db.scalars(
        select(NoteRelation).where(NoteRelation.user_id == user.id)
    )
    adj: dict[uuid.UUID, list[tuple[uuid.UUID, float, NoteRelation]]] = defaultdict(list)
    for r in rels:
        weight = 1.0 - r.similarity_score
        adj[r.source_note_id].append((r.target_note_id, weight, r))
        adj[r.target_note_id].append((r.source_note_id, weight, r))
    if source not in adj or target not in adj:
        raise HTTPException(status_code=404, detail="两个节点之间没有通路")

    prev: dict[uuid.UUID, uuid.UUID | None] = {source: None}
    edge_map: dict[uuid.UUID, NoteRelation] = {}
    queue: deque[uuid.UUID] = deque([source])
    found = False
    while queue:
        cur = queue.popleft()
        for nb, _w, rel in adj.get(cur, []):
            if nb in prev:
                continue
            prev[nb] = cur
            edge_map[nb] = rel
            if nb == target:
                found = True
                break
            queue.append(nb)
        if found:
            break
    if not found:
        raise HTTPException(status_code=404, detail="两个节点之间没有通路")

    path_ids: list[uuid.UUID] = []
    cur: uuid.UUID | None = target
    while cur is not None:
        path_ids.append(cur)
        cur = prev[cur]
    path_ids.reverse()

    notes = await db.scalars(
        select(Note).where(Note.id.in_(path_ids)).options(selectinload(Note.tags))
    )
    note_map = {n.id: n for n in notes}
    nodes_out = [
        GraphNodeOut(
            id=n.id,
            title=n.title,
            status=n.status,
            tags=[t.name for t in n.tags],
            color=n.tags[0].color if n.tags else None,
            summary=n.summary,
            degree=0,
        )
        for n in (note_map.get(i) for i in path_ids)
        if n is not None
    ]
    links_out: list[GraphLinkOut] = []
    distance = 0.0
    for a, b in zip(path_ids, path_ids[1:]):
        rel = edge_map.get(b)
        if rel is None:
            continue
        links_out.append(
            GraphLinkOut(
                source=a,
                target=b,
                similarity_score=rel.similarity_score,
                reason=rel.relation_reason,
            )
        )
        distance += 1.0 - rel.similarity_score
    return ok(PathOut(nodes=nodes_out, links=links_out, distance=round(distance, 4)))
