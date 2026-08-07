"""笔记相关请求/响应模型。"""
import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.tag import TagOut


class NoteCreate(BaseModel):
    title: str | None = Field(default=None, max_length=255)
    content: str = Field(min_length=1, description="Markdown 正文，必填")
    summary: str | None = None
    tags: list[str] = []  # 手工指定的标签名，可选


class NoteUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    summary: str | None = None
    tags: list[str] | None = None
    reprocess: bool = False  # 正文大改时选择重新处理


class NoteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    title: str | None
    content: str
    summary: str | None
    status: str
    processing_status: str
    tags: list[TagOut] = []
    last_reviewed_at: datetime | None
    created_at: datetime
    updated_at: datetime


class NoteCreateOut(BaseModel):
    id: uuid.UUID
    status: str
    processing_status: str
    job_id: uuid.UUID
    message: str


class ReprocessResult(BaseModel):
    """重新处理任务结果（与 NoteCreateOut 同构）。"""

    id: uuid.UUID
    status: str
    processing_status: str
    job_id: uuid.UUID
    message: str


class RelatedNoteOut(BaseModel):
    id: uuid.UUID
    title: str | None
    similarity: float
    reason: str | None


class ReviewInfoOut(BaseModel):
    stage: int
    next_review_date: date | None


class NoteDetailOut(BaseModel):
    note: NoteOut
    related: list[RelatedNoteOut]
    review: ReviewInfoOut | None
