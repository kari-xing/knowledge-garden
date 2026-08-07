"""ai_jobs 表：异步 AI 处理任务追踪。"""
import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, UUIDMixin


class AiJob(UUIDMixin, Base):
    __tablename__ = "ai_jobs"
    __table_args__ = (
        Index("ix_ai_jobs_user_status_created", "user_id", "status", "created_at"),
    )

    note_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("notes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    # pipeline=新建处理 / regenerate=重新处理 / import=导入处理
    job_type: Mapped[str] = mapped_column(
        String(16), default="pipeline", server_default="pipeline"
    )
    # pending / processing / done / failed
    status: Mapped[str] = mapped_column(
        String(16), default="pending", server_default="pending"
    )
    pipeline_version: Mapped[str | None] = mapped_column(String(16))  # 幂等版本号
    attempts: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    error_message: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )
