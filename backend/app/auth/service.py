from datetime import datetime, timezone, timedelta
from typing import Optional
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import RefreshToken
from app.users.repository import UserRepository
from app.core.security import verify_password, create_access_token, create_refresh_token, decode_token
from app.core.config import settings
from app.shared.exceptions import UnauthorizedException
from app.auth.schemas import LoginRequest, Token


class AuthService:
    """
    Service layer for Authentication workflows.
    """
    def __init__(self, session: AsyncSession):
        self.session = session
        self.user_repo = UserRepository(session)

    async def login(self, login_in: LoginRequest) -> Token:
        """Authenticate user and issue tokens."""
        user = await self.user_repo.get_by_username_or_email(login_in.identifier)

        if not user or not user.is_active or not verify_password(login_in.password, user.hashed_password):
            raise UnauthorizedException("Invalid credentials or inactive account")

        # Create tokens
        access_token = create_access_token(user.id, user.role.value)
        refresh_token_str = create_refresh_token(user.id, user.role.value)

        # Store refresh token in DB (Option B)
        new_refresh = RefreshToken(
            user_id=user.id,
            token=refresh_token_str,
            expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        )
        self.session.add(new_refresh)

        # Update last login
        user.last_login_at = datetime.now(timezone.utc)

        return Token(
            access_token=access_token,
            refresh_token=refresh_token_str,
            user=user
        )

    async def refresh_access_token(self, refresh_token_str: str) -> Token:
        """Issue new access token using a valid, stored refresh token."""
        # 1. Validate token in DB
        query = select(RefreshToken).where(RefreshToken.token == refresh_token_str)
        result = await self.session.execute(query)
        db_token = result.scalar_one_or_none()

        if not db_token or db_token.expires_at < datetime.now(timezone.utc):
            if db_token:
                await self.session.delete(db_token)
            raise UnauthorizedException("Invalid or expired refresh token")

        # 2. Get user
        user = await self.user_repo.get_by_id(db_token.user_id)
        if not user or not user.is_active:
            raise UnauthorizedException("User not found or inactive")

        # 3. Create new tokens (Rotate access token)
        access_token = create_access_token(user.id, user.role.value)

        return Token(
            access_token=access_token,
            refresh_token=refresh_token_str, # Keep same refresh token or rotate
            user=user
        )

    async def logout(self, refresh_token_str: str) -> bool:
        """Invalidate a session by deleting the refresh token."""
        query = delete(RefreshToken).where(RefreshToken.token == refresh_token_str)
        result = await self.session.execute(query)
        return result.rowcount > 0
