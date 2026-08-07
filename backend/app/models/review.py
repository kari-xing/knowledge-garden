"""review_schedule（间隔重复计划）与 review_logs（复习历史）。"""
import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Index, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, UUIDMixin


class ReviewSchedule(UUIDMixin, Base):
    """一笔记一条的复习计划。"""

    __tablename__ = "review_schedule"
    __table_args__ = (Index("ix_review_schedule_next_date", "next_review_date"),)

    note_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("notes.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    review_stage: Mapped[int] = mapped_column(Integer, default=1, server_default="1")
    next_review_date: Mapped[date] = mapped_column(Date, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class ReviewLog(UUIDMixin, Base):
    """每次复习动作的历史记录，用于统计与 streak。"""

    __tablename__ = "review_logs"
    __table_args__ = (
        Index("ix_review_logs_note_id", "note_id"),
        Index("ix_review_logs_reviewed_at", "reviewed_at"),
    )

    note_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("notes.id", ondelete="CASCADE"),
        nullable=False,
    )
    reviewed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    stage_before: Mapped[int] = mapped_column(Integer, nullable=False)
    stage_after: Mapped[int] = mapped_column(Integer, nullable=False)
    # remember / fuzzy
    result: Mapped[str] = mapped_column(String(8), default="remember", server_default="remember")
