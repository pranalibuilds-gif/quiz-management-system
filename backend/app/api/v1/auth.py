from typing import Annotated
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.auth.service import AuthService
from app.auth.schemas import LoginRequest, RefreshRequest, Token
from app.shared.schemas import APIResponse

router = APIRouter()


@router.post("/login", response_model=APIResponse[Token])
async def login(
    session: Annotated[AsyncSession, Depends(get_db)],
    login_in: LoginRequest
):
    service = AuthService(session)
    token_data = await service.login(login_in)
    await session.commit() # Persist refresh token and last_login

    return APIResponse(
        success=True,
        message="Login successful",
        data=token_data
    )


@router.post("/refresh", response_model=APIResponse[Token])
async def refresh_token(
    session: Annotated[AsyncSession, Depends(get_db)],
    refresh_in: RefreshRequest
):
    service = AuthService(session)
    token_data = await service.refresh_access_token(refresh_in.refresh_token)
    await session.commit()

    return APIResponse(
        success=True,
        message="Token refreshed successfully",
        data=token_data
    )


@router.post("/logout", response_model=APIResponse[bool])
async def logout(
    session: Annotated[AsyncSession, Depends(get_db)],
    refresh_in: RefreshRequest
):
    service = AuthService(session)
    success = await service.logout(refresh_in.refresh_token)
    await session.commit()

    return APIResponse(
        success=True,
        message="Logout successful",
        data=success
    )
