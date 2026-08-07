"""向量存储工厂：按配置返回单例。"""
from functools import lru_cache

from app.vector.base import BaseVectorStore


@lru_cache
def get_vector_store() -> BaseVectorStore:
    # 备选实现：切换 pgvector 时在此替换 import（代码层已抽象，决策 D1）
    from app.vector.chromadb_store import ChromaStore

    return ChromaStore()
