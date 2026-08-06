from typing import Generic, TypeVar, Type, Optional, Sequence
import uuid
from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.base_model import Base

T = TypeVar("T", bound=Base)


class BaseRepository(Generic[T]):
    """
    Base repository providing common CRUD operations.
    """
    def __init__(self, model: Type[T], session: AsyncSession):
        self.model = model
        self.session = session

    async def get_by_id(self, id: uuid.UUID) -> Optional[T]:
        """Fetch a single record by its UUID."""
        query = select(self.model).where(self.model.id == id)
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def list_all(self, skip: int = 0, limit: int = 100) -> Sequence[T]:
        """Fetch a list of records with pagination."""
        query = select(self.model).offset(skip).limit(limit)
        result = await self.session.execute(query)
        return result.scalars().all()

    async def create(self, obj: T) -> T:
        """Persist a new object to the database."""
        self.session.add(obj)
        await self.session.flush() # Flush to get the ID/defaults
        return obj

    async def update(self, id: uuid.UUID, **kwargs) -> Optional[T]:
        """Update an existing object by ID."""
        query = (
            update(self.model)
            .where(self.model.id == id)
            .values(**kwargs)
            .returning(self.model)
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def delete(self, id: uuid.UUID) -> bool:
        """Permanently delete an object by ID."""
        query = delete(self.model).where(self.model.id == id)
        result = await self.session.execute(query)
        return result.rowcount > 0

    async def soft_delete(self, id: uuid.UUID) -> bool:
        """Soft delete an object (if it supports SoftDeleteMixin)."""
        if hasattr(self.model, "deleted_at"):
            from datetime import datetime, timezone
            return await self.update(id, deleted_at=datetime.now(timezone.utc)) is not None
        return False
