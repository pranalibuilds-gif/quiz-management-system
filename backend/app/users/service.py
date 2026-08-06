from typing import Optional, Sequence
import uuid
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession

from app.users.models import User
from app.users.repository import UserRepository
from app.users.schemas import UserCreate, UserUpdate, PasswordChange
from app.core.security import hash_password, verify_password
from app.shared.exceptions import AppException, NotFoundException


class UserService:
    """
    Service layer for User-related business logic.
    """
    def __init__(self, session: AsyncSession):
        self.repository = UserRepository(session)
        self.session = session

    async def register_user(self, user_in: UserCreate) -> User:
        """Logic for registering a new user with validation."""
        # 1. Normalize data
        username = user_in.username.lower()
        email = user_in.email.lower()

        # 2. Check for duplicates
        if await self.repository.exists_username(username):
            raise AppException("Username already exists", status_code=400)

        if await self.repository.exists_email(email):
            raise AppException("Email already exists", status_code=400)

        # 3. Hash password and create entity
        db_user = User(
            full_name=user_in.full_name,
            username=username,
            email=email,
            hashed_password=hash_password(user_in.password),
            role=user_in.role
        )

        # 4. Persist
        return await self.repository.create(db_user)

    async def get_user(self, user_id: uuid.UUID) -> User:
        """Fetch a user or raise 404."""
        user = await self.repository.get_by_id(user_id)
        if not user:
            raise NotFoundException("User not found")
        return user

    async def update_profile(self, user_id: uuid.UUID, user_in: UserUpdate) -> User:
        """Update user profile details."""
        user = await self.get_user(user_id)

        update_data = user_in.model_dump(exclude_unset=True)
        if "email" in update_data:
            update_data["email"] = update_data["email"].lower()
            if update_data["email"] != user.email:
                if await self.repository.exists_email(update_data["email"]):
                    raise AppException("Email already exists", status_code=400)

        return await self.repository.update(user_id, **update_data)

    async def change_password(self, user_id: uuid.UUID, password_in: PasswordChange) -> bool:
        """Securely update a user's password."""
        user = await self.get_user(user_id)

        if not verify_password(password_in.old_password, user.hashed_password):
            raise AppException("Invalid old password", status_code=400)

        new_hashed = hash_password(password_in.new_password)
        await self.repository.update(
            user_id,
            hashed_password=new_hashed,
            password_changed_at=datetime.now(timezone.utc)
        )
        return True

    async def soft_delete_user(self, user_id: uuid.UUID) -> bool:
        """Deactivate and soft delete a user account."""
        user = await self.get_user(user_id)
        await self.repository.update(user_id, is_active=False)
        return await self.repository.soft_delete(user_id)

    async def list_students(self, skip: int = 0, limit: int = 100) -> Sequence[User]:
        """Fetch students for admin view."""
        return await self.repository.list_students(skip, limit)
