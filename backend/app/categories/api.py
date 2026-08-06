from typing import Annotated, Sequence
import uuid
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.categories.service import CategoryService
from app.categories.schemas import CategoryCreate, CategoryRead, CategoryUpdate
from app.core.dependencies import get_current_admin, get_current_user
from app.users.models import User
from app.shared.schemas import APIResponse

router = APIRouter()


@router.post("/", response_model=APIResponse[CategoryRead], status_code=status.HTTP_201_CREATED)
async def create_category(
    session: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[User, Depends(get_current_admin)],
    category_in: CategoryCreate
):
    """Admin only: Create a new category."""
    service = CategoryService(session)
    category = await service.create_category(category_in)
    await session.commit()

    return APIResponse(
        success=True,
        message="Category created successfully",
        data=category
    )


@router.get("/", response_model=APIResponse[Sequence[CategoryRead]])
async def list_categories(
    session: Annotated[AsyncSession, Depends(get_db)],
    active_only: bool = True
):
    """Public/Student: List all categories."""
    service = CategoryService(session)
    categories = await service.list_categories(active_only=active_only)

    return APIResponse(
        success=True,
        message="Categories fetched",
        data=categories
    )


@router.get("/{category_id}", response_model=APIResponse[CategoryRead])
async def get_category(
    session: Annotated[AsyncSession, Depends(get_db)],
    category_id: uuid.UUID
):
    """Public/Student: Get category details."""
    service = CategoryService(session)
    category = await service.get_category(category_id)

    return APIResponse(
        success=True,
        message="Category details fetched",
        data=category
    )


@router.patch("/{category_id}", response_model=APIResponse[CategoryRead])
async def update_category(
    session: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[User, Depends(get_current_admin)],
    category_id: uuid.UUID,
    category_in: CategoryUpdate
):
    """Admin only: Update category details."""
    service = CategoryService(session)
    category = await service.update_category(category_id, category_in)
    await session.commit()

    return APIResponse(
        success=True,
        message="Category updated successfully",
        data=category
    )


@router.delete("/{category_id}", response_model=APIResponse[bool])
async def delete_category(
    session: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[User, Depends(get_current_admin)],
    category_id: uuid.UUID
):
    """Admin only: Soft delete a category."""
    service = CategoryService(session)
    success = await service.delete_category(category_id)
    await session.commit()

    return APIResponse(
        success=True,
        message="Category deleted successfully",
        data=success
    )
