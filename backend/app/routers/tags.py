"""标签管理。"""
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import get_current_user
from app.models.note import note_tags
from app.models.tag import Tag
from app.models.user import User
from app.schemas.common import ok
from app.schemas.tag import TagMergeRequest, TagOut, TagUpdate, TagWithCount

router = APIRouter(prefix="/tags", tags=["标签"])


async def _get_owned_tag(db, user, tag_id) -> Tag:
    tag = await db.get(Tag, tag_id)
    if tag is None or tag.user_id != user.id:
        raise HTTPException(status_code=404, detail="标签不存在")
    return tag


@router.get("")
async def list_tags(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    rows = await db.execute(
        select(Tag, func.count(note_tags.c.note_id).label("cnt"))
        .outerjoin(note_tags, note_tags.c.tag_id == Tag.id)
        .where(Tag.user_id == user.id)
        .group_by(Tag.id)
        .order_by(Tag.name)
    )
    items = []
    for tag, cnt in rows.all():
        base = TagOut.model_validate(tag).model_dump()
        items.append(TagWithCount(**base, note_count=cnt))
    return ok(items)


@router.put("/{tag_id}")
async def update_tag(
    tag_id: uuid.UUID,
    body: TagUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    tag = await _get_owned_tag(db, user, tag_id)
    if body.name is not None:
        name = body.name.strip()
        dup = await db.scalar(
            select(Tag).where(
                Tag.user_id == user.id,
                func.lower(Tag.name) == name.lower(),
                Tag.id != tag.id,
            )
        )
        if dup is not None:
            raise HTTPException(status_code=409, detail="同名标签已存在")
        tag.name = name
    if body.color is not None:
        tag.color = body.color
    await db.commit()
    await db.refresh(tag)
    return ok(TagOut.model_validate(tag))


@router.delete("/{tag_id}")
async def delete_tag(
    tag_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    tag = await _get_owned_tag(db, user, tag_id)
    await db.delete(tag)
    await db.commit()
    return ok(None)


@router.post("/merge")
async def merge_tags(
    body: TagMergeRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    source = await _get_owned_tag(db, user, body.source_id)
    target = await _get_owned_tag(db, user, body.target_id)
    if source.id == target.id:
        raise HTTPException(status_code=400, detail="不能合并同一个标签")
    # 先删去目标已存在的重复绑定，再把源标签的笔记迁移到目标
    await db.execute(
        note_tags.delete().where(
            note_tags.c.tag_id == source.id,
            note_tags.c.note_id.in_(
                select(note_tags.c.note_id).where(note_tags.c.tag_id == target.id)
            ),
        )
    )
    await db.execute(
        note_tags.update()
        .where(note_tags.c.tag_id == source.id)
        .values(tag_id=target.id)
    )
    await db.delete(source)
    await db.commit()
    await db.refresh(target)
    return ok(TagOut.model_validate(target))
