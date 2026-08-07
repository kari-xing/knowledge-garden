"""向量存储抽象基类（ChromaDB 实现 / 备选 pgvector，决策 D1）。"""
from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class VectorHit:
    note_id: str
    score: float
    metadata: dict | None = None


class BaseVectorStore(ABC):
    @abstractmethod
    async def upsert(self, note_id: str, text: str, metadata: dict) -> None:
        """写入 / 覆盖向量。"""

    @abstractmethod
    async def delete(self, note_id: str) -> None:
        """删除单个向量（删除笔记时级联清理）。"""

    @abstractmethod
    async def query(
        self, text: str, top_k: int, where: dict | None = None
    ) -> list[VectorHit]:
        """语义检索 TopK。"""
