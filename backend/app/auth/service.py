from datetime import datetime, timezone, timedelta
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import RefreshToken
from app.users.repository import UserRepository
from app.core.security import (
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_token
)
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

        # Enforce both is_active and soft-delete rules
        if not user or not user.is_active or user.deleted_at or not verify_password(login_in.password, user.hashed_password):
            raise UnauthorizedException("Invalid credentials or inactive account")

        # Create tokens
        access_token = create_access_token(user.id, user.role)
        refresh_token_str = create_refresh_token(user.id, user.role)

        # Store hashed refresh token in DB (Security refinement)
        hashed_refresh = hash_token(refresh_token_str)
        new_refresh = RefreshToken(
            user_id=user.id,
            token=hashed_refresh, # Store hash, not raw token
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
        """
        Issue new access token and ROTATE refresh token.
        Implements Refresh Token Rotation for maximum security.
        """
        # 1. Decode token to get subject (raises JWTError if invalid)
        try:
            token_data = decode_token(refresh_token_str)
            if token_data.type != "refresh":
                raise UnauthorizedException("Invalid token type")
        except Exception:
            raise UnauthorizedException("Invalid or expired refresh token")

        # 2. Validate hashed token in DB
        hashed_input = hash_token(refresh_token_str)
        query = select(RefreshToken).where(RefreshToken.token == hashed_input)
        result = await self.session.execute(query)
        db_token = result.scalar_one_or_none()

        if not db_token or db_token.expires_at < datetime.now(timezone.utc):
            if db_token:
                await self.session.delete(db_token)
            raise UnauthorizedException("Invalid or expired refresh token")

        # 3. Get user and verify they can still login
        user = await self.user_repo.get_by_id(db_token.user_id)
        if not user or not user.is_active or user.deleted_at:
            await self.session.delete(db_token) # Invalidate session for security
            raise UnauthorizedException("User not found or inactive")

        # 4. ROTATE: Delete old token and create a brand new pair
        await self.session.delete(db_token)

        new_access = create_access_token(user.id, user.role)
        new_refresh_str = create_refresh_token(user.id, user.role)

        new_db_refresh = RefreshToken(
            user_id=user.id,
            token=hash_token(new_refresh_str),
            expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        )
        self.session.add(new_db_refresh)

        return Token(
            access_token=new_access,
            refresh_token=new_refresh_str,
            user=user
        )

    async def logout(self, refresh_token_str: str) -> bool:
        """Invalidate a session by deleting the hashed refresh token."""
        hashed_token = hash_token(refresh_token_str)
        query = delete(RefreshToken).where(RefreshToken.token == hashed_token)
        result = await self.session.execute(query)
        return result.rowcount > 0
