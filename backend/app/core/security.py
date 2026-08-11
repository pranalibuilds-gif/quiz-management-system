import hashlib
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Union, Optional

from jose import jwt, JWTError
from passlib.context import CryptContext
from pydantic import BaseModel

from app.core.config import settings
from app.shared.enums import UserRole

# Password hashing context using Argon2
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


class TokenData(BaseModel):
    """
    Structured payload decoded from a JWT.
    """
    sub: uuid.UUID
    role: UserRole
    type: str
    exp: datetime
    jti: str


def hash_password(password: str) -> str:
    """Returns the hashed version of the plaintext password."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies if the plain password matches the hashed password."""
    return pwd_context.verify(plain_password, hashed_password)


def hash_token(token: str) -> str:
    """
    Returns a SHA-256 hash of a token string.
    Used for storing refresh tokens securely in the database.
    """
    return hashlib.sha256(token.encode()).hexdigest()


def _create_token(
    subject: uuid.UUID,
    role: UserRole,
    expires_delta: timedelta,
    token_type: str = "access"
) -> str:
    """
    Internal helper to generate a JWT token with standard claims.
    """
    now = datetime.now(timezone.utc)
    expire = now + expires_delta

    to_encode = {
        "iat": now,
        "nbf": now,
        "exp": expire,
        "sub": str(subject),
        "role": role.value,
        "type": token_type,
        "jti": str(uuid.uuid4()),
        "iss": settings.PROJECT_NAME,
        "aud": "quiz-management-platform"
    }

    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY.get_secret_value(),
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def create_access_token(subject: uuid.UUID, role: UserRole) -> str:
    """Generates an access token (shorter lifespan)."""
    expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return _create_token(subject, role, expires_delta, token_type="access")


def create_refresh_token(subject: uuid.UUID, role: UserRole) -> str:
    """Generates a refresh token (longer lifespan)."""
    expires_delta = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    return _create_token(subject, role, expires_delta, token_type="refresh")


def decode_token(token: str) -> TokenData:
    """
    Decodes and validates a JWT token.
    Raises JWTError or ExpiredSignatureError on failure.
    """
    payload = jwt.decode(
        token,
        settings.SECRET_KEY.get_secret_value(),
        algorithms=[settings.ALGORITHM],
        audience="quiz-management-platform"
    )
    return TokenData(**payload)
