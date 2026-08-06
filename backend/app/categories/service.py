from typing import Sequence, Optional
import uuid
from sqlalchemy.ext.asyncio import AsyncSession

from app.categories.models import Category
from app.categories.repository import CategoryRepository
from app.categories.schemas import CategoryCreate, CategoryUpdate
from app.shared.exceptions import AppException, NotFoundException
from app.shared.utils import slugify


class CategoryService:
    """
    Service layer for Category business logic.
    """
    def __init__(self, session: AsyncSession):
        self.repository = CategoryRepository(session)
        self.session = session

    async def create_category(self, category_in: CategoryCreate) -> Category:
        """Create a new category with name uniqueness check."""
        if await self.repository.get_by_name(category_in.name):
            raise AppException("Category with this name already exists", status_code=400)

        category_data = category_in.model_dump()
        category_data["slug"] = slugify(category_in.name)

        category = Category(**category_data)
        return await self.repository.create(category)

    async def get_category(self, category_id: uuid.UUID) -> Category:
        """Fetch a category or raise 404."""
        category = await self.repository.get_by_id(category_id)
        if not category or category.deleted_at:
            raise NotFoundException("Category not found")
        return category

    async def list_categories(self, active_only: bool = False, skip: int = 0, limit: int = 100) -> Sequence[Category]:
        """List categories with optional filtering."""
        if active_only:
            return await self.repository.list_active(skip, limit)
        return await self.repository.list_all(skip, limit)

    async def update_category(self, category_id: uuid.UUID, category_in: CategoryUpdate) -> Category:
        """Update an existing category."""
        category = await self.get_category(category_id)

        update_data = category_in.model_dump(exclude_unset=True)
        if "name" in update_data and update_data["name"] != category.name:
            if await self.repository.get_by_name(update_data["name"]):
                raise AppException("Category with this name already exists", status_code=400)
            update_data["slug"] = slugify(update_data["name"])

        return await self.repository.update(category_id, **update_data)

    async def delete_category(self, category_id: uuid.UUID) -> bool:
        """
        Soft delete a category.
        Note: We should check if it has published quizzes before allowing delete.
        """
        category = await self.get_category(category_id)
        # Check if category has quizzes (for now we allow delete, but SET NULL on FK)
        return await self.repository.soft_delete(category_id)
