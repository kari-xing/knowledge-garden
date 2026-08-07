"""花园看板聚合。"""
from datetime import date, datetime, time, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import get_current_user
from app.models.note import Note
from app.models.relation import NoteRelation
from app.models.review import ReviewSchedule
from app.models.user import User
from app.schemas.common import ok
from app.schemas.garden import (
    DashboardOut,
    GardenStatsOut,
    RelationEventOut,
    ReviewTodayItemOut,
    SeedItemOut,
    TrendItemOut,
    WiltingItemOut,
)
from app.services.stats_service import recalc_stats

router = APIRouter(prefix="/garden", tags=["花园"])


@router.get("/dashboard")
async def dashboard(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    stats = await recalc_stats(db, user.id)
    now = datetime.now(timezone.utc)
    seven_days_ago = now - timedelta(days=7)

    seeds = await db.scalars(
        select(Note)
        .where(
            Note.user_id == user.id,
            Note.status.in_(["seed", "growing"]),
            Note.created_at >= seven_days_ago,
        )
        .order_by(Note.created_at.desc())
        .limit(12)
    )
    wilting = await db.scalars(
        select(Note)
        .where(Note.user_id == user.id, Note.status == "wilted")
        .order_by(Note.last_reviewed_at.asc().nulls_last())
        .limit(12)
    )
    today = date.today()
    review_rows = await db.execute(
        select(ReviewSchedule, Note)
        .join(Note, Note.id == ReviewSchedule.note_id)
        .where(
            Note.user_id == user.id,
            Note.status != "archived",
            ReviewSchedule.next_review_date <= today,
        )
        .order_by(ReviewSchedule.next_review_date.asc())
        .limit(12)
    )
    rels = await db.scalars(
        select(NoteRelation)
        .where(NoteRelation.user_id == user.id)
        .order_by(NoteRelation.created_at.desc())
        .limit(10)
    )
    rel_ids = set()
    for r in rels:
        rel_ids.add(r.source_note_id)
        rel_ids.add(r.target_note_id)
    rel_titles: dict = {}
    if rel_ids:
        rel_notes = await db.scalars(select(Note).where(Note.id.in_(rel_ids)))
        rel_titles = {n.id: n.title for n in rel_notes}

    trend = []
    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        start = datetime.combine(d, time.min, tzinfo=timezone.utc)
        end = start + timedelta(days=1)
        cnt = (
            await db.scalar(
                select(func.count())
                .select_from(Note)
                .where(
                    Note.user_id == user.id,
                    Note.created_at >= start,
                    Note.created_at < end,
                )
            )
            or 0
        )
        trend.append(TrendItemOut(date=d, count=cnt))

    return ok(
        DashboardOut(
            seeds=[
                SeedItemOut(
                    id=n.id,
                    title=n.title,
                    summary=n.summary,
                    status=n.status,
                    created_at=n.created_at,
                )
                for n in seeds
            ],
            wilting=[
                WiltingItemOut(
                    id=n.id,
                    title=n.title,
                    summary=n.summary,
                    last_reviewed_at=n.last_reviewed_at,
                )
                for n in wilting
            ],
            review_today=[
                ReviewTodayItemOut(
                    id=note.id,
                    title=note.title,
                    summary=note.summary,
                    stage=sch.review_stage,
                    next_review_date=sch.next_review_date,
                )
                for sch, note in review_rows.all()
            ],
            stats=GardenStatsOut(
                total_notes=stats.total_notes,
                total_tags=stats.total_tags,
                total_relations=stats.total_relations,
                streak_days=stats.streak_days,
            ),
            latest_relations=[
                RelationEventOut(
                    id=r.id,
                    source_title=rel_titles.get(r.source_note_id),
                    target_title=rel_titles.get(r.target_note_id),
                    relation_reason=r.relation_reason,
                    similarity_score=r.similarity_score,
                    created_at=r.created_at,
                )
                for r in rels
            ],
            trend=trend,
        )
    )


@router.get("/seeds")
async def seeds(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    rows = await db.scalars(
        select(Note)
        .where(
            Note.user_id == user.id,
            Note.status.in_(["seed", "growing"]),
            Note.created_at >= seven_days_ago,
        )
        .order_by(Note.created_at.desc())
        .limit(50)
    )
    return ok(
        [
            SeedItemOut(
                id=n.id,
                title=n.title,
                summary=n.summary,
                status=n.status,
                created_at=n.created_at,
            )
            for n in rows
        ]
    )


@router.get("/wilting")
async def wilting(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    rows = await db.scalars(
        select(Note)
        .where(Note.user_id == user.id, Note.status == "wilted")
        .order_by(Note.last_reviewed_at.asc().nulls_last())
        .limit(50)
    )
    return ok(
        [
            WiltingItemOut(
                id=n.id,
                title=n.title,
                summary=n.summary,
                last_reviewed_at=n.last_reviewed_at,
            )
            for n in rows
        ]
    )


@router.get("/review-today")
async def review_today(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    today = date.today()
    rows = await db.execute(
        select(ReviewSchedule, Note)
        .join(Note, Note.id == ReviewSchedule.note_id)
        .where(
            Note.user_id == user.id,
            Note.status != "archived",
            ReviewSchedule.next_review_date <= today,
        )
        .order_by(ReviewSchedule.next_review_date.asc())
        .limit(50)
    )
    return ok(
        [
            ReviewTodayItemOut(
                id=note.id,
                title=note.title,
                summary=note.summary,
                stage=sch.review_stage,
                next_review_date=sch.next_review_date,
            )
            for sch, note in rows.all()
        ]
    )
