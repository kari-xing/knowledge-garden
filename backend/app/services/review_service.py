"""间隔重复复习服务（艾宾浩斯变体：1→3→7→15→30 天）。"""
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.note import Note
from app.models.review import ReviewLog, ReviewSchedule


def calculate_next_review(stage: int) -> date:
    intervals = settings.review_intervals
    days = intervals.get(5) if stage >= 5 else intervals.get(stage, 1)
    return date.today() + timedelta(days=days)


async def get_schedule(
    db: AsyncSession, note_id
) -> ReviewSchedule | None:
    return await db.scalar(
        select(ReviewSchedule).where(ReviewSchedule.note_id == note_id)
    )


async def apply_review(
    db: AsyncSession, user_id, note: Note, result: str
) -> tuple[int, date, str]:
    """执行一次复习，返回 (stage_after, next_review_date, status_after)。"""
    schedule = await get_schedule(db, note.id)
    if schedule is None:
        schedule = ReviewSchedule(
            note_id=note.id, review_stage=1, next_review_date=date.today()
        )
        db.add(schedule)

    stage_before = schedule.review_stage
    if result == "fuzzy":
        stage_after = max(stage_before - 1, 1)
    else:
        stage_after = min(stage_before + 1, 5)
    schedule.review_stage = stage_after
    schedule.next_review_date = calculate_next_review(stage_after)

    # 生命周期状态机：wilted 复活；累计 ≥3 阶段成熟
    if note.status == "wilted":
        note.status = "growing"
    elif stage_after >= 3 and note.status in ("seed", "growing"):
        note.status = "mature"
    note.last_reviewed_at = datetime.now(timezone.utc)

    db.add(
        ReviewLog(
            note_id=note.id,
            stage_before=stage_before,
            stage_after=stage_after,
            result=result,
        )
    )
    await db.commit()
    await db.refresh(note)
    return stage_after, schedule.next_review_date, note.status
