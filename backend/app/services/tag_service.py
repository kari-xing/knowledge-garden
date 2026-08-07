"""标签服务：名称解析、笔记标签同步。"""
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.note import Note
from app.models.tag import Tag
from app.utils import next_color


async def resolve_tags(
    db: AsyncSession, user_id, names: list[str] | None
) -> list[Tag]:
    """按名称获取或创建标签（同名去重，大小写不敏感）。"""
    result: list[Tag] = []
    seen: set[str] = set()
    for raw in names or []:
        name = raw.strip()
        if not name or name.casefold() in seen:
            continue
        seen.add(name.casefold())
        tag = await db.scalar(
            select(Tag).where(
                Tag.user_id == user_id, func.lower(Tag.name) == name.lower()
            )
        )
        if tag is None:
            tag = Tag(user_id=user_id, name=name, color=next_color())
            db.add(tag)
            await db.flush()
        result.append(tag)
    return result


async def sync_note_tags(
    db: AsyncSession, note: Note, names: list[str] | None
) -> list[Tag]:
    """将笔记标签集合同步为指定名称列表。"""
    tags = await resolve_tags(db, note.user_id, names)
    note.tags = tags
    return tags
