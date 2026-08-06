from typing import Annotated
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import decode_token
from app.database.session import get_db
from app.users.repository import UserRepository
from app.users.models import User
from app.shared.exceptions import UnauthorizedException, ForbiddenException
from app.shared.enums import UserRole

# OAuth2 scheme for token extraction from Authorization header
reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)


async def get_current_user(
    session: Annotated[AsyncSession, Depends(get_db)],
    token: Annotated[str, Depends(reusable_oauth2)]
) -> User:
    """
    Dependency that validates the JWT and returns the current User object.
    """
    try:
        token_data = decode_token(token)

        # Ensure we are using an access token for general authentication
        if token_data.type != "access":
            raise UnauthorizedException("Invalid token type")

        user_id = token_data.sub
    except JWTError:
        raise UnauthorizedException("Could not validate credentials")
    except Exception:
        raise UnauthorizedException("Could not validate credentials")

    repository = UserRepository(session)
    user = await repository.get_by_id(user_id)

    # Enforce is_active and soft-delete rules
    if not user or not user.is_active or user.deleted_at:
        raise UnauthorizedException("User not found or account is inactive")

    return user


async def get_current_admin(
    current_user: Annotated[User, Depends(get_current_user)]
) -> User:
    """
    Dependency that ensures the current user has the ADMIN role.
    """
    if current_user.role != UserRole.ADMIN:
        raise ForbiddenException("The user doesn't have enough privileges")
    return current_user
