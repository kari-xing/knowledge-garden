"""FastAPI 应用入口：启动建表、后台调度、CORS、路由挂载。"""
import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine
from app.models import Base  # noqa: F401  确保所有模型注册到 metadata
from app.routers import auth, garden, graph, imports, notes, search, tags
from app.tasks.scheduler import scheduler_loop


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动时自动建表（幂等）
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    # 后台调度：枯萎扫描 / 每日关联发现
    scheduler = asyncio.create_task(scheduler_loop())
    yield
    scheduler.cancel()
    try:
        await scheduler
    except asyncio.CancelledError:
        pass
    await engine.dispose()


app = FastAPI(
    title=settings.APP_NAME,
    version="0.1.0",
    description="融合笔记管理 + AI 智能处理 + 知识图谱可视化的个人知识库系统",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for router in (
    auth.router,
    notes.router,
    search.router,
    graph.router,
    garden.router,
    tags.router,
    imports.router,
):
    app.include_router(router, prefix=settings.API_PREFIX)


@app.get(f"{settings.API_PREFIX}/health", tags=["系统"])
async def health():
    return {"status": "ok"}
