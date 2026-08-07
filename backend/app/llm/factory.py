"""LLM Provider 工厂：按配置返回单例。"""
from functools import lru_cache

from app.config import settings
from app.llm.base import BaseLLM


@lru_cache
def get_llm() -> BaseLLM:
    if settings.LLM_PROVIDER == "ollama":
        from app.llm.ollama_provider import OllamaProvider

        return OllamaProvider()
    if settings.LLM_PROVIDER == "openai_compatible":
        from app.llm.openai_compatible import OpenAICompatibleProvider

        return OpenAICompatibleProvider()
    from app.llm.deepseek_provider import DeepSeekProvider

    return DeepSeekProvider()
