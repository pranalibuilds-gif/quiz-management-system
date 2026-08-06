from typing import Annotated, Sequence, Optional
import uuid
from fastapi import APIRouter, Depends, status, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.quizzes.service import QuizService
from app.quizzes.schemas import QuizCreate, QuizRead, QuizUpdate, QuizStatusUpdate
from app.core.dependencies import get_current_admin, get_current_user
from app.users.models import User
from app.shared.schemas import APIResponse

router = APIRouter()


@router.post("/", response_model=APIResponse[QuizRead], status_code=status.HTTP_201_CREATED)
async def create_quiz(
    session: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[User, Depends(get_current_admin)],
    quiz_in: QuizCreate
):
    """Admin only: Create a new quiz draft."""
    service = QuizService(session)
    quiz = await service.create_quiz(quiz_in)
    await session.commit()

    return APIResponse(
        success=True,
        message="Quiz created successfully",
        data=quiz
    )


@router.get("/", response_model=APIResponse[Sequence[QuizRead]])
async def list_quizzes(
    session: Annotated[AsyncSession, Depends(get_db)],
    category_id: Optional[uuid.UUID] = None,
    published_only: bool = True
):
    """Public/Student: List published quizzes. Admin can see all via flag."""
    service = QuizService(session)
    quizzes = await service.list_quizzes(
        published_only=published_only,
        category_id=category_id
    )

    return APIResponse(
        success=True,
        message="Quizzes fetched",
        data=quizzes
    )


@router.get("/{quiz_id}", response_model=APIResponse[QuizRead])
async def get_quiz(
    session: Annotated[AsyncSession, Depends(get_db)],
    quiz_id: uuid.UUID
):
    """Public/Student: Get quiz details."""
    service = QuizService(session)
    quiz = await service.get_quiz(quiz_id)

    return APIResponse(
        success=True,
        message="Quiz details fetched",
        data=quiz
    )


@router.patch("/{quiz_id}", response_model=APIResponse[QuizRead])
async def update_quiz(
    session: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[User, Depends(get_current_admin)],
    quiz_id: uuid.UUID,
    quiz_in: QuizUpdate
):
    """Admin only: Update quiz metadata or configuration."""
    service = QuizService(session)
    quiz = await service.update_quiz(quiz_id, quiz_in)
    await session.commit()

    return APIResponse(
        success=True,
        message="Quiz updated successfully",
        data=quiz
    )


@router.patch("/{quiz_id}/status", response_model=APIResponse[QuizRead])
async def update_quiz_status(
    session: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[User, Depends(get_current_admin)],
    quiz_id: uuid.UUID,
    status_in: QuizStatusUpdate
):
    """Admin only: Change quiz status (Publish/Archive)."""
    service = QuizService(session)
    quiz = await service.update_status(quiz_id, status_in.status)
    await session.commit()

    return APIResponse(
        success=True,
        message=f"Quiz status updated to {status_in.status}",
        data=quiz
    )


@router.delete("/{quiz_id}", response_model=APIResponse[bool])
async def delete_quiz(
    session: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[User, Depends(get_current_admin)],
    quiz_id: uuid.UUID
):
    """Admin only: Soft delete a quiz."""
    service = QuizService(session)
    success = await service.delete_quiz(quiz_id)
    await session.commit()

    return APIResponse(
        success=True,
        message="Quiz deleted successfully",
        data=success
    )


@router.post("/{quiz_id}/thumbnail", response_model=APIResponse[QuizRead])
async def upload_quiz_thumbnail(
    session: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[User, Depends(get_current_admin)],
    quiz_id: uuid.UUID,
    file: UploadFile = File(...)
):
    """Admin only: Upload a thumbnail for the quiz."""
    service = QuizService(session)
    quiz = await service.upload_thumbnail(quiz_id, file)
    await session.commit()

    return APIResponse(
        success=True,
        message="Thumbnail uploaded successfully",
        data=quiz
    )
