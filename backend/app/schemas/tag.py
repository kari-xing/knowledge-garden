"""标签相关请求/响应模型。"""
import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class TagOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    color: str
    created_at: datetime


class TagWithCount(TagOut):
    note_count: int = 0


class TagUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=64)
    color: str | None = Field(default=None, max_length=16)


class TagMergeRequest(BaseModel):
    source_id: uuid.UUID
    target_id: uuid.UUID
