"""复习相关请求/响应模型。"""
from datetime import date

from pydantic import BaseModel


class ReviewRequest(BaseModel):
    result: str = "remember"  # remember / fuzzy，缺省 remember


class ReviewResponse(BaseModel):
    stage_after: int
    next_review_date: date
    status_after: str
