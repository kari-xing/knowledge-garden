"""认证：注册 / 登录。"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.schemas.auth import AuthOut, LoginRequest, RegisterRequest, UserOut
from app.schemas.common import ok
from app.security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["认证"])


@router.post("/register")
async def register(
    body: RegisterRequest, db: AsyncSession = Depends(get_db)
):
    exists = await db.scalar(select(User).where(User.email == body.email))
    if exists is not None:
        raise HTTPException(status_code=400, detail="该邮箱已注册")
    user = User(
        email=body.email,
        password_hash=hash_password(body.password),
        display_name=body.display_name,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    token = create_access_token(str(user.id))
    return ok(AuthOut(token=token, user=UserOut.model_validate(user)))


@router.post("/login")
async def login(
    body: LoginRequest, db: AsyncSession = Depends(get_db)
):
    user = await db.scalar(select(User).where(User.email == body.email))
    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="邮箱或密码错误")
    token = create_access_token(str(user.id))
    return ok(AuthOut(token=token, user=UserOut.model_validate(user)))
