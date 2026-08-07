"""多格式导入：PDF / txt / md。"""
import io

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import get_current_user
from app.models.ai_job import AiJob
from app.models.note import Note
from app.models.tag import Tag
from app.models.user import User
from app.schemas.common import ok
from app.schemas.imports import ImportResultOut
from app.services.ai_pipeline import process_note
from app.services.tag_service import resolve_tags
from app.utils import first_line

router = APIRouter(prefix="/import", tags=["导入"])

MAX_PDF_BYTES = 20 * 1024 * 1024


def _parse_markdown(raw: str) -> tuple[str | None, str, list[str]]:
    """解析 Markdown frontmatter（--- 包裹的 YAML 子集）→ (title, content, tags)。"""
    text = raw.lstrip("\ufeff")
    title: str | None = None
    tags: list[str] = []
    if text.startswith("---"):
        end = text.find("\n---", 3)
        if end > 0:
            fm = text[3:end]
            body = text[end + 4:].lstrip("\n")
            for line in fm.splitlines():
                line = line.strip()
                if line.startswith("title:"):
                    title = line.split(":", 1)[1].strip().strip('"\'')
                elif line.startswith("tags:"):
                    tag_part = line.split(":", 1)[1].strip()
                    tags = [
                        t.strip().strip('"\'')
                        for t in tag_part.strip("[]").split(",")
                        if t.strip()
                    ]
            return title, body, tags
    return title, text, tags


async def _create_with_job(
    db, user, title, content, tags, background: BackgroundTasks
) -> None:
    resolved: list[Tag] = []
    if tags:
        resolved = await resolve_tags(db, user.id, tags)
    note = Note(
        user_id=user.id,
        title=title or first_line(content),
        content=content,
        status="seed",
        processing_status="pending",
        tags=resolved,
    )
    db.add(note)
    await db.flush()
    job = AiJob(note_id=note.id, user_id=user.id, job_type="import", status="pending")
    db.add(job)
    await db.flush()
    background.add_task(process_note, note.id, user.id, "import")


@router.post("/text")
async def import_text(
    files: list[UploadFile] = File(...),
    background: BackgroundTasks = BackgroundTasks(),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    created = 0
    failed = 0
    messages: list[str] = []
    for f in files:
        try:
            raw = (await f.read()).decode("utf-8", errors="replace")
            name = f.filename or ""
            if name.lower().endswith(".md"):
                title, content, tags = _parse_markdown(raw)
            else:
                title, content, tags = None, raw, []
            if not content.strip():
                failed += 1
                messages.append(f"{name}: 文件为空")
                continue
            await _create_with_job(db, user, title, content, tags, background)
            created += 1
        except Exception as exc:  # noqa: BLE001
            failed += 1
            messages.append(f"{f.filename or 'unknown'}: {exc}")
    await db.commit()
    return ok(ImportResultOut(created=created, failed=failed, messages=messages or None))


@router.post("/pdf")
async def import_pdf(
    file: UploadFile = File(...),
    background: BackgroundTasks = BackgroundTasks(),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    data = await file.read()
    if len(data) > MAX_PDF_BYTES:
        raise HTTPException(status_code=400, detail="PDF 文件不能超过 20MB")
    try:
        import pdfplumber

        with pdfplumber.open(io.BytesIO(data)) as pdf:
            text = "\n".join((page.extract_text() or "") for page in pdf.pages)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=f"PDF 解析失败：{exc}") from exc
    if not text.strip():
        raise HTTPException(status_code=400, detail="未从 PDF 中提取到文本")
    await _create_with_job(db, user, None, text, [], background)
    await db.commit()
    return ok(ImportResultOut(created=1, failed=0, messages=None))
