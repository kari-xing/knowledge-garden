"""notes 表 + note_tags 多对多关联表。"""
import uuid
from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    Column,
    Computed,
    DateTime,
    ForeignKey,
    Index,
    String,
    Table,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, CreatedAtMixin, UUIDMixin

# 多对多：note <-> tag
note_tags = Table(
    "note_tags",
    Base.metadata,
    Column(
        "note_id",
        UUID(as_uuid=True),
        ForeignKey("notes.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "tag_id",
        UUID(as_uuid=True),
        ForeignKey("tags.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Index("ix_note_tags_tag_id", "tag_id"),
)


class Note(UUIDMixin, CreatedAtMixin, Base):
    __tablename__ = "notes"
    __table_args__ = (
        CheckConstraint(
            "status IN ('seed','growing','mature','wilted','archived')",
            name="ck_notes_status",
        ),
        CheckConstraint(
            "processing_status IN ('pending','processing','done','failed')",
            name="ck_notes_processing_status",
        ),
        Index("ix_notes_user_created", "user_id", "created_at"),
        Index("ix_notes_user_status", "user_id", "status"),
        Index("ix_notes_user_processing", "user_id", "processing_status"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    title: Mapped[str | None] = mapped_column(String(255))  # 可为空，由 AI 补全
    content: Mapped[str] = mapped_column(Text, nullable=False)  # Markdown 正文
    summary: Mapped[str | None] = mapped_column(Text)  # AI 一句话摘要，可手改
    status: Mapped[str] = mapped_column(
        String(16), default="seed", server_default="seed"
    )
    processing_status: Mapped[str] = mapped_column(
        String(16), default="pending", server_default="pending"
    )
    last_reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    # 全文检索生成列（title 权重 A + content 权重 B）
    # 中文分词可用 zhparser/pg_jieba 时，将 'simple' 替换为对应配置
    search_vector: Mapped[str] = mapped_column(
        Text,
        Computed(
            "to_tsvector('simple', coalesce(title, '') || ' ' || content)",
            persisted=True,
        ),
    )

    tags = relationship("Tag", secondary=note_tags, back_populates="notes")
