"""花园看板相关模型。"""
import uuid
from datetime import date, datetime

from pydantic import BaseModel


class SeedItemOut(BaseModel):
    id: uuid.UUID
    title: str | None
    summary: str | None
    status: str
    created_at: datetime


class WiltingItemOut(BaseModel):
    id: uuid.UUID
    title: str | None
    summary: str | None
    last_reviewed_at: datetime | None


class ReviewTodayItemOut(BaseModel):
    id: uuid.UUID
    title: str | None
    summary: str | None
    stage: int
    next_review_date: date


class GardenStatsOut(BaseModel):
    total_notes: int
    total_tags: int
    total_relations: int
    streak_days: int


class RelationEventOut(BaseModel):
    id: uuid.UUID
    source_title: str | None
    target_title: str | None
    relation_reason: str | None
    similarity_score: float
    created_at: datetime


class TrendItemOut(BaseModel):
    date: date
    count: int


class DashboardOut(BaseModel):
    seeds: list[SeedItemOut]
    wilting: list[WiltingItemOut]
    review_today: list[ReviewTodayItemOut]
    stats: GardenStatsOut
    latest_relations: list[RelationEventOut]
    trend: list[TrendItemOut]
