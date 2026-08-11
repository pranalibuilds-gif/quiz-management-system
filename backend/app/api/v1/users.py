from typing import Annotated, Sequence, Optional
import uuid
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.users.service import UserService
from app.users.schemas import UserCreate, UserRead, UserUpdate, PasswordChange
from app.users.models import User
from app.core.dependencies import get_current_user, get_current_admin
from app.shared.schemas import APIResponse

router = APIRouter()


@router.post("/register", response_model=APIResponse[UserRead], status_code=status.HTTP_201_CREATED)
async def register(
    session: Annotated[AsyncSession, Depends(get_db)],
    user_in: UserCreate
):
    service = UserService(session)
    user = await service.register_user(user_in)
    await session.commit()

    return APIResponse(
        success=True,
        message="User registered successfully",
        data=user
    )


@router.get("/me", response_model=APIResponse[UserRead])
async def get_my_profile(
    current_user: Annotated[User, Depends(get_current_user)]
):
    return APIResponse(
        success=True,
        message="Profile fetched",
        data=current_user
    )


@router.patch("/me", response_model=APIResponse[UserRead])
async def update_my_profile(
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    user_in: UserUpdate
):
    service = UserService(session)
    user = await service.update_profile(current_user.id, user_in)
    await session.commit()

    return APIResponse(
        success=True,
        message="Profile updated",
        data=user
    )


@router.post("/me/change-password", response_model=APIResponse[bool])
async def change_my_password(
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    password_in: PasswordChange
):
    service = UserService(session)
    success = await service.change_password(current_user.id, password_in)
    await session.commit()

    return APIResponse(
        success=True,
        message="Password changed successfully",
        data=success
    )


@router.delete("/me", response_model=APIResponse[bool])
async def delete_my_account(
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)]
):
    service = UserService(session)
    success = await service.soft_delete_user(current_user.id)
    await session.commit()

    return APIResponse(
        success=True,
        message="Account deleted successfully",
        data=success
    )


# Admin routes
@router.get("/", response_model=APIResponse[Sequence[UserRead]])
async def list_students(
    session: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[User, Depends(get_current_admin)],
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100)
):
    """Admin only: List students with filtering and searching."""
    service = UserService(session)
    students = await service.list_students(search, is_active, skip, limit)

    return APIResponse(
        success=True,
        message="Students listed",
        data=students
    )


@router.patch("/{user_id}/status", response_model=APIResponse[UserRead])
async def update_student_status(
    session: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[User, Depends(get_current_admin)],
    user_id: uuid.UUID,
    is_active: bool = Query(...)
):
    """Admin only: Activate or deactivate a student account."""
    service = UserService(session)
    user = await service.update_status(user_id, is_active)
    await session.commit()

    return APIResponse(
        success=True,
        message=f"User {'activated' if is_active else 'deactivated'} successfully",
        data=user
    )


@router.delete("/{user_id}", response_model=APIResponse[bool])
async def delete_student(
    session: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[User, Depends(get_current_admin)],
    user_id: uuid.UUID
):
    """Admin only: Soft delete a student account."""
    service = UserService(session)
    success = await service.soft_delete_user(user_id)
    await session.commit()

    return APIResponse(
        success=True,
        message="User deleted successfully",
        data=success
    )
