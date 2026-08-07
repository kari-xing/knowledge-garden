"""Ollama 本地推理 Provider（默认，隐私优先）。"""
import httpx

from app.config import settings
from app.llm.base import BaseLLM


class OllamaProvider(BaseLLM):
    def __init__(
        self,
        base_url: str | None = None,
        model: str | None = None,
        embedding_model: str | None = None,
    ) -> None:
        self.base_url = (base_url or settings.OLLAMA_BASE_URL).rstrip("/")
        self.model = model or settings.OLLAMA_MODEL
        self.embedding_model = embedding_model or settings.OLLAMA_EMBEDDING_MODEL

    async def complete(self, prompt: str, *, json_mode: bool = False) -> str:
        payload: dict = {"model": self.model, "prompt": prompt, "stream": False}
        if json_mode:
            payload["format"] = "json"  # Ollama 结构化输出约束
        async with httpx.AsyncClient(timeout=180) as client:
            resp = await client.post(f"{self.base_url}/api/generate", json=payload)
            resp.raise_for_status()
            return resp.json().get("response", "")

    async def embed(self, text: str) -> list[float]:
        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(
                f"{self.base_url}/api/embeddings",
                json={"model": self.embedding_model, "prompt": text},
            )
            resp.raise_for_status()
            return resp.json().get("embedding", [])

    async def healthcheck(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                resp = await client.get(f"{self.base_url}/api/tags")
            return resp.status_code == 200
        except httpx.HTTPError:
            return False
