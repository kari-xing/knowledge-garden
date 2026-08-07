"""通用工具函数：标签配色、LLM JSON 解析、文本处理。"""
import json
import re
from itertools import cycle

# Tailwind 500 色阶调色板（新标签按序轮询取色）
TAG_COLOR_PALETTE = [
    "#6366F1",  # indigo
    "#EC4899",  # pink
    "#10B981",  # emerald
    "#F59E0B",  # amber
    "#06B6D4",  # cyan
    "#F43F5E",  # rose
    "#0EA5E9",  # sky
    "#8B5CF6",  # violet
    "#14B8A6",  # teal
    "#F97316",  # orange
]
_color_iter = cycle(TAG_COLOR_PALETTE)


def next_color() -> str:
    return next(_color_iter)


def parse_json_list(raw: str, default: list[str] | None = None) -> list[str]:
    """解析 LLM 输出的 JSON 数组；容错去 ```json 包裹、中英文逗号与列表符号。"""
    text = (raw or "").strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    try:
        data = json.loads(text)
        if isinstance(data, list):
            return [str(x).strip() for x in data if str(x).strip()]
        if isinstance(data, dict):
            for value in data.values():
                if isinstance(value, list):
                    return [str(x).strip() for x in value if str(x).strip()]
    except json.JSONDecodeError:
        pass
    items = [x.strip().lstrip("-* ").strip() for x in re.split(r"[,，\n]", text)]
    return [x for x in items if x] or (default or [])


def first_line(content: str, limit: int = 60) -> str:
    """取正文首个非空行作为默认标题。"""
    for line in (content or "").splitlines():
        line = line.strip().lstrip("# ").strip()
        if line:
            return line[:limit]
    return "未命名笔记"


def make_snippet(text: str, query: str, radius: int = 60) -> str:
    """围绕首个命中位置截取高亮片段。"""
    text = text or ""
    idx = text.lower().find(query.lower()) if query else -1
    if idx < 0:
        head = text[: radius * 2].strip()
        return head + ("..." if len(text) > radius * 2 else "")
    start = max(0, idx - radius)
    end = min(len(text), idx + len(query) + radius)
    prefix = "…" if start > 0 else ""
    suffix = "…" if end < len(text) else ""
    return f"{prefix}{text[start:end]}{suffix}"
