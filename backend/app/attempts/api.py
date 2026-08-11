import uuid
from typing import Annotated, List, Union
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.attempts.service import AttemptService
from app.attempts.schemas import AttemptRead, AttemptFullRead, AttemptReviewRead, QuizSubmission
from app.core.dependencies import get_current_user
from app.users.models import User
from app.shared.schemas import APIResponse

router = APIRouter()


@router.post("/{quiz_id}/start", response_model=APIResponse[AttemptFullRead], status_code=status.HTTP_201_CREATED)
async def start_quiz_attempt(
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    quiz_id: uuid.UUID
):
    """Student: Start a new quiz attempt."""
    service = AttemptService(session)
    attempt = await service.start_attempt(current_user.id, quiz_id)
    await session.commit()

    return APIResponse(
        success=True,
        message="Attempt started successfully",
        data=attempt
    )


@router.get("/{attempt_id}", response_model=APIResponse[Union[AttemptReviewRead, AttemptFullRead]])
async def get_attempt_details(
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    attempt_id: uuid.UUID
):
    """Student: Get details of a specific attempt (Snapshot)."""
    service = AttemptService(session)
    attempt = await service.get_attempt(attempt_id, user_id=current_user.id)

    # Check review status
    from app.attempts.services.review import ReviewService
    review_status = ReviewService.get_review_status(attempt)

    # Use appropriate schema based on review eligibility
    if review_status["can_review"]:
        return APIResponse(
            success=True,
            message="Detailed attempt review fetched",
            data=attempt,
            meta={"review_status": review_status}
        )

    return APIResponse(
        success=True,
        message="Attempt details fetched (Review locked)",
        data=attempt,
        meta={"review_status": review_status}
    )


@router.post("/{attempt_id}/submit", response_model=APIResponse[AttemptRead])
async def submit_quiz_attempt(
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    attempt_id: uuid.UUID,
    submission: QuizSubmission
):
    """Student: Submit quiz answers and get immediate score."""
    service = AttemptService(session)
    attempt = await service.submit_attempt(attempt_id, current_user.id, submission)
    await session.commit()

    return APIResponse(
        success=True,
        message="Attempt submitted and scored successfully",
        data=attempt
    )


@router.patch("/{attempt_id}/questions/{question_id}/answer", response_model=APIResponse[bool])
async def save_question_answer(
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    attempt_id: uuid.UUID,
    question_id: uuid.UUID,
    answer_in: SingleAnswerUpdate
):
    """Student: Save a single answer during an active attempt."""
    service = AttemptService(session)
    success = await service.save_answer(attempt_id, current_user.id, question_id, answer_in.option_id)
    await session.commit()

    return APIResponse(
        success=True,
        message="Answer saved",
        data=success
    )


@router.get("/", response_model=APIResponse[List[AttemptRead]])
async def list_my_attempts(
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)]
):
    """Student: List all previous attempts."""
    service = AttemptService(session)
    attempts = await service.list_user_attempts(current_user.id)

    return APIResponse(
        success=True,
        message="Attempts history fetched",
        data=attempts
    )
