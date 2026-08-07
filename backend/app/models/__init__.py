"""模型聚合导出：确保所有模型注册到 Base.metadata。"""
from app.models.base import Base
from app.models.user import User
from app.models.tag import Tag
from app.models.note import Note, note_tags
from app.models.relation import NoteRelation
from app.models.review import ReviewLog, ReviewSchedule
from app.models.ai_job import AiJob
from app.models.stats import UserGardenStats

__all__ = [
    "Base",
    "User",
    "Tag",
    "Note",
    "note_tags",
    "NoteRelation",
    "ReviewLog",
    "ReviewSchedule",
    "AiJob",
    "UserGardenStats",
]
