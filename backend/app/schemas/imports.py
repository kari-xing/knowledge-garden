"""导入相关响应模型。"""
from pydantic import BaseModel


class ImportResultOut(BaseModel):
    created: int = 0
    failed: int = 0
    messages: list[str] | None = None
