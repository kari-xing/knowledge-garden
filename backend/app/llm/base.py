"""LLM / Embedding Provider 抽象基类。"""
from abc import ABC, abstractmethod


class BaseLLM(ABC):
    @abstractmethod
    async def complete(self, prompt: str, *, json_mode: bool = False) -> str:
        """文本补全（生成）。"""

    @abstractmethod
    async def embed(self, text: str) -> list[float]:
        """文本嵌入向量。"""

    @abstractmethod
    async def healthcheck(self) -> bool:
        """服务是否可用。"""
