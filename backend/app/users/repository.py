from typing import Optional, Sequence
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.shared.repository import BaseRepository
from app.users.models import User
from app.shared.enums import UserRole


class UserRepository(BaseRepository[User]):
    """
    Repository for User-specific database operations.
    """
    def __init__(self, session: AsyncSession):
        super().__init__(User, session)

    async def get_by_username(self, username: str) -> Optional[User]:
        """Fetch a user by their unique username."""
        query = select(User).where(User.username == username.lower())
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> Optional[User]:
        """Fetch a user by their unique email."""
        query = select(User).where(User.email == email.lower())
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_by_username_or_email(self, identifier: str) -> Optional[User]:
        """Fetch a user by either username or email (used for login)."""
        identifier = identifier.lower()
        query = select(User).where(
            or_(User.username == identifier, User.email == identifier)
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def exists_username(self, username: str) -> bool:
        """Check if a username is already taken."""
        user = await self.get_by_username(username)
        return user is not None

    async def exists_email(self, email: str) -> bool:
        """Check if an email is already registered."""
        user = await self.get_by_email(email)
        return user is not None

    async def list_students(self, skip: int = 0, limit: int = 100) -> Sequence[User]:
        """Fetch all users with the STUDENT role."""
        query = (
            select(User)
            .where(User.role == UserRole.STUDENT)
            .offset(skip)
            .limit(limit)
        )
        result = await self.session.execute(query)
        return result.scalars().all()
