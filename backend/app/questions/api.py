import uuid
from typing import Annotated, List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.questions.service import QuestionService
from app.questions.schemas import QuestionCreate, QuestionRead, QuestionUpdate, OptionUpdate, OptionRead
from app.core.dependencies import get_current_admin
from app.users.models import User
from app.shared.schemas import APIResponse

router = APIRouter()


@router.post("/{quiz_id}/questions", response_model=APIResponse[QuestionRead], status_code=status.HTTP_201_CREATED)
async def add_question(
    session: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[User, Depends(get_current_admin)],
    quiz_id: uuid.UUID,
    question_in: QuestionCreate
):
    """Admin only: Add a question with options to a quiz."""
    service = QuestionService(session)
    question = await service.add_question_to_quiz(quiz_id, question_in)
    await session.commit()

    return APIResponse(
        success=True,
        message="Question added successfully",
        data=question
    )


@router.get("/{quiz_id}/questions", response_model=APIResponse[List[QuestionRead]])
async def list_questions(
    session: Annotated[AsyncSession, Depends(get_db)],
    quiz_id: uuid.UUID
):
    """Public/Admin: List all questions for a quiz."""
    service = QuestionService(session)
    questions = await service.list_quiz_questions(quiz_id)

    return APIResponse(
        success=True,
        message="Questions fetched",
        data=questions
    )


@router.patch("/questions/{question_id}", response_model=APIResponse[QuestionRead])
async def update_question(
    session: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[User, Depends(get_current_admin)],
    question_id: uuid.UUID,
    question_in: QuestionUpdate
):
    """Admin only: Update question text, explanation, marks or order."""
    service = QuestionService(session)
    question = await service.update_question(question_id, question_in)
    await session.commit()

    return APIResponse(
        success=True,
        message="Question updated successfully",
        data=question
    )


@router.patch("/options/{option_id}", response_model=APIResponse[OptionRead])
async def update_option(
    session: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[User, Depends(get_current_admin)],
    option_id: uuid.UUID,
    option_in: OptionUpdate
):
    """Admin only: Update option text or correctness."""
    service = QuestionService(session)
    option = await service.update_option(option_id, option_in)
    await session.commit()

    return APIResponse(
        success=True,
        message="Option updated successfully",
        data=option
    )


@router.delete("/questions/{question_id}", response_model=APIResponse[bool])
async def delete_question(
    session: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[User, Depends(get_current_admin)],
    question_id: uuid.UUID
):
    """Admin only: Soft delete a question."""
    service = QuestionService(session)
    success = await service.delete_question(question_id)
    await session.commit()

    return APIResponse(
        success=True,
        message="Question deleted successfully",
        data=success
    )
