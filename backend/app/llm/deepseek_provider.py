"""DeepSeek API Provider（OpenAI 兼容协议，默认）。"""
import httpx

from app.config import settings
from app.llm.base import BaseLLM


class DeepSeekProvider(BaseLLM):
    def __init__(self) -> None:
        self.base_url = settings.DEEPSEEK_API_BASE.rstrip("/")
        self.api_key = settings.DEEPSEEK_API_KEY
        self.model = settings.DEEPSEEK_MODEL

    def _headers(self) -> dict[str, str]:
        return {"Authorization": f"Bearer {self.api_key}"}

    async def complete(self, prompt: str, *, json_mode: bool = False) -> str:
        payload: dict = {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
        }
        if json_mode:
            payload["response_format"] = {"type": "json_object"}
        async with httpx.AsyncClient(timeout=180) as client:
            resp = await client.post(
                f"{self.base_url}/chat/completions",
                headers=self._headers(),
                json=payload,
            )
            resp.raise_for_status()
            return resp.json()["choices"][0]["message"]["content"]

    async def embed(self, text: str) -> list[float]:
        # DeepSeek 暂不提供 embedding API：嵌入模型继续使用 Ollama 的 bge-m3
        base = settings.OLLAMA_BASE_URL.rstrip("/")
        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(
                f"{base}/api/embeddings",
                json={"model": settings.OLLAMA_EMBEDDING_MODEL, "prompt": text},
            )
            resp.raise_for_status()
            return resp.json().get("embedding", [])

    async def healthcheck(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                resp = await client.get(
                    f"{self.base_url}/models", headers=self._headers()
                )
            return resp.status_code == 200
        except httpx.HTTPError:
            return False
