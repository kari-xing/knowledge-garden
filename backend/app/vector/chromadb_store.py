"""ChromaDB 向量存储实现（向量唯一来源，决策 D1）。"""
import chromadb

from app.config import settings
from app.vector.base import BaseVectorStore, VectorHit


class ChromaStore(BaseVectorStore):
    def __init__(
        self,
        host: str | None = None,
        port: int | None = None,
        collection_name: str | None = None,
    ) -> None:
        self._client = chromadb.HttpClient(
            host=host or settings.CHROMA_HOST,
            port=port or settings.CHROMA_PORT,
        )
        self._collection = self._client.get_or_create_collection(
            name=collection_name or settings.CHROMA_COLLECTION,
            metadata={"hnsw:space": "cosine"},
        )

    async def upsert(self, note_id: str, text: str, metadata: dict) -> None:
        self._collection.upsert(
            ids=[note_id],
            documents=[text],
            metadatas=[{**metadata, "note_id": note_id}],
        )

    async def delete(self, note_id: str) -> None:
        self._collection.delete(ids=[note_id])

    async def query(
        self, text: str, top_k: int, where: dict | None = None
    ) -> list[VectorHit]:
        result = self._collection.query(
            query_texts=[text],
            n_results=top_k,
            where=where,
        )
        ids = result.get("ids", [[]])[0]
        distances = result.get("distances", [[]])[0]
        metadatas = result.get("metadatas", [[]])[0]
        hits: list[VectorHit] = []
        for note_id, distance, metadata in zip(ids, distances, metadatas):
            # Chroma 余弦距离 -> 相似度
            score = 1.0 - (float(distance) if distance is not None else 1.0)
            hits.append(
                VectorHit(
                    note_id=note_id,
                    score=max(0.0, min(1.0, score)),
                    metadata=metadata or None,
                )
            )
        return hits
