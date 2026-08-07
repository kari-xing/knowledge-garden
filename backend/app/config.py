"""应用配置：从环境变量 / .env 读取。"""
import json
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    APP_NAME: str = "AI 知识花园"
    API_PREFIX: str = "/api/v1"
    DEBUG: bool = True

    # 数据库
    DATABASE_URL: str = "postgresql+asyncpg://garden:garden@localhost:5432/knowledge_garden"
    REDIS_URL: str = "redis://localhost:6379/0"

    # JWT
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_DAYS: int = 7

    # LLM Provider：deepseek（默认）| ollama | openai_compatible
    LLM_PROVIDER: str = "deepseek"
    # DeepSeek（默认 LLM，OpenAI 兼容协议）
    DEEPSEEK_API_BASE: str = "https://api.deepseek.com"
    DEEPSEEK_API_KEY: str = ""
    DEEPSEEK_MODEL: str = "deepseek-v4-flash"
    # Ollama 本地推理（可选，嵌入模型继续使用 bge-m3）
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "qwen2.5:3b"
    OLLAMA_EMBEDDING_MODEL: str = "bge-m3"
    # 备选：任意 OpenAI 兼容 API
    OPENAI_API_BASE: str = "https://api.openai.com/v1"
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"
    EMBEDDING_DIM: int = 1024

    # AI 流水线
    PIPELINE_VERSION: str = "v1"
    SIMILARITY_THRESHOLD: float = 0.7
    TOP_K: int = 5
    # True 时通过 ARQ(Redis) 执行 AI 流水线；False 降级为 BackgroundTasks
    USE_ARQ: bool = False

    # 向量库 ChromaDB
    CHROMA_HOST: str = "localhost"
    CHROMA_PORT: int = 8001
    CHROMA_COLLECTION: str = "knowledge_garden"

    # 复习与生命周期
    REVIEW_INTERVALS_JSON: str = '{"1": 1, "2": 3, "3": 7, "4": 15, "5": 30}'
    WILT_DAYS: int = 30
    WILT_WARN_DAYS: int = 25

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost"]

    @property
    def review_intervals(self) -> dict[int, int]:
        raw = json.loads(self.REVIEW_INTERVALS_JSON)
        return {int(k): int(v) for k, v in raw.items()}


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
