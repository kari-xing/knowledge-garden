"""user_garden_stats 表：花园统计（写时增量更新 + 每日对账）。"""
import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Integer, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, UUIDMixin


class UserGardenStats(UUIDMixin, Base):
    __tablename__ = "user_garden_stats"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    total_notes: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    total_tags: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    total_relations: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    streak_days: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    last_active: Mapped[date | None] = mapped_column(Date)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
