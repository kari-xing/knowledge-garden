"""混合检索相关模型。"""
from pydantic import BaseModel

from app.schemas.note import NoteOut


class SearchHitOut(BaseModel):
    note: NoteOut
    score: float
    matched_fields: list[str] = []  # content / title / semantic
    snippet: str | None = None


class SearchResultOut(BaseModel):
    items: list[SearchHitOut]
    total: int
