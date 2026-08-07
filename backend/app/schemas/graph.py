"""知识图谱相关模型。"""
import uuid

from pydantic import BaseModel


class GraphNodeOut(BaseModel):
    id: uuid.UUID
    title: str | None
    status: str
    tags: list[str] = []
    color: str | None = None  # 主标签颜色
    summary: str | None = None
    degree: int = 0  # 关联度


class GraphLinkOut(BaseModel):
    source: uuid.UUID
    target: uuid.UUID
    similarity_score: float
    reason: str | None = None


class PathOut(BaseModel):
    nodes: list[GraphNodeOut]
    links: list[GraphLinkOut]
    distance: float
