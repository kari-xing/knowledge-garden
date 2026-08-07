"""通用响应包裹与分页模型。"""
from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    code: int = 0
    message: str = "ok"
    data: T | None = None


class Page(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int = 1
    page_size: int = 20


def ok(data: T | None = None, message: str = "ok") -> ApiResponse[T]:
    return ApiResponse(code=0, message=message, data=data)
