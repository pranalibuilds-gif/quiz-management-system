from datetime import datetime, timedelta, timezone
from typing import Any, Union, Optional
import uuid

from jose import jwt
from passlib.context import CryptContext

from app.core.config import settings

# Password hashing context using Argon2
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


def hash_password(password: str) -> str:
    """Returns the hashed version of the plaintext password."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies if the plain password matches the hashed password."""
    return pwd_context.verify(plain_password, hashed_password)


def create_token(
    subject: Union[str, Any],
    role: str,
    expires_delta: timedelta,
    token_type: str = "access"
) -> str:
    """Generates a JWT token for the given subject and role."""
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "role": role,
        "type": token_type
    }
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY.get_secret_value(),
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def create_access_token(subject: Union[str, Any], role: str) -> str:
    """Convenience helper for creating access tokens."""
    expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return create_token(subject, role, expires_delta, token_type="access")


def create_refresh_token(subject: Union[str, Any], role: str) -> str:
    """Convenience helper for creating refresh tokens."""
    expires_delta = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    return create_token(subject, role, expires_delta, token_type="refresh")


def decode_token(token: str) -> dict[str, Any]:
    """Decodes a JWT token and returns the payload."""
    return jwt.decode(
        token,
        settings.SECRET_KEY.get_secret_value(),
        algorithms=[settings.ALGORITHM]
    )
