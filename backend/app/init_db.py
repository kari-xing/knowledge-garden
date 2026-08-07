"""手动建表脚本：python -m app.init_db"""
import asyncio

from app.database import engine
from app.models import Base  # noqa: F401


async def main() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("数据库表创建完成")
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
