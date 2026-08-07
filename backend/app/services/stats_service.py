"""花园统计服务：读写 user_garden_stats。"""
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.note import Note
from app.models.relation import NoteRelation
from app.models.stats import UserGardenStats
from app.models.tag import Tag


async def get_or_create_stats(
    db: AsyncSession, user_id
) -> UserGardenStats:
    stats = await db.scalar(
        select(UserGardenStats).where(UserGardenStats.user_id == user_id)
    )
    if stats is None:
        stats = UserGardenStats(user_id=user_id)
        db.add(stats)
        await db.flush()
    return stats


async def recalc_stats(db: AsyncSession, user_id) -> UserGardenStats:
    """写时对账：重算笔记/标签/关联总数。"""
    stats = await get_or_create_stats(db, user_id)
    stats.total_notes = (
        await db.scalar(
            select(func.count()).select_from(Note).where(Note.user_id == user_id)
        )
        or 0
    )
    stats.total_tags = (
        await db.scalar(
            select(func.count()).select_from(Tag).where(Tag.user_id == user_id)
        )
        or 0
    )
    stats.total_relations = (
        await db.scalar(
            select(func.count())
            .select_from(NoteRelation)
            .where(NoteRelation.user_id == user_id)
        )
        or 0
    )
    await db.flush()
    return stats
