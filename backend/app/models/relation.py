"""note_relations 表：知识图谱无向边（相似度 + AI 关联理由）。"""
import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, Float, ForeignKey, Index, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, UUIDMixin


class NoteRelation(UUIDMixin, Base):
    __tablename__ = "note_relations"
    __table_args__ = (
        UniqueConstraint("source_note_id", "target_note_id", name="uq_relation_pair"),
        CheckConstraint("similarity_score BETWEEN 0 AND 1", name="ck_relation_score"),
        # 无向边去重：source 恒小于 target
        CheckConstraint("source_note_id < target_note_id", name="ck_relation_order"),
        Index("ix_relations_user_created", "user_id", "created_at"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    source_note_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("notes.id", ondelete="CASCADE"),
        nullable=False,
    )
    target_note_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("notes.id", ondelete="CASCADE"),
        nullable=False,
    )
    similarity_score: Mapped[float] = mapped_column(Float, nullable=False)
    relation_reason: Mapped[str | None] = mapped_column(Text)  # AI 一句话理由
    # auto=创建时自动发现 / daily=每日任务 / manual=用户手动
    source: Mapped[str] = mapped_column(String(16), default="auto", server_default="auto")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
