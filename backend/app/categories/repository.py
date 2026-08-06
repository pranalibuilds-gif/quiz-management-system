from typing import Optional, Sequence
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.shared.repository import BaseRepository
from app.categories.models import Category


class CategoryRepository(BaseRepository[Category]):
    """
    Repository for Category-specific database operations.
    """
    def __init__(self, session: AsyncSession):
        super().__init__(Category, session)

    async def get_by_name(self, name: str) -> Optional[Category]:
        """Fetch a category by its unique name."""
        query = select(Category).where(Category.name == name)
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def list_active(self, skip: int = 0, limit: int = 100) -> Sequence[Category]:
        """Fetch all active and non-deleted categories."""
        query = (
            select(Category)
            .where(Category.is_active == True)
            .where(Category.deleted_at == None)
            .offset(skip)
            .limit(limit)
        )
        result = await self.session.execute(query)
        return result.scalars().all()
