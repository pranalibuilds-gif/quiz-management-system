import uuid
from typing import List, Sequence, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.attempts.models import Attempt
from app.attempts.repository import AttemptRepository
from app.attempts.services.builder import AttemptBuilder
from app.attempts.services.submission import SubmissionService
from app.attempts.services.review import ReviewService
from app.attempts.schemas import QuizSubmission


class AttemptService:
    """
    Facade Service for Quiz Attempt lifecycle and scoring.
    Orchestrates specialized sub-services.
    """
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repository = AttemptRepository(session)

    async def start_attempt(self, user_id: uuid.UUID, quiz_id: uuid.UUID) -> Attempt:
        """Eligibility check and creation of a randomized attempt snapshot."""
        builder = AttemptBuilder(self.session)
        return await builder.build(user_id, quiz_id)

    async def get_attempt(self, attempt_id: uuid.UUID, user_id: Optional[uuid.UUID] = None) -> Attempt:
        """Fetch attempt with details or raise 404."""
        attempt = await self.repository.get_with_details(attempt_id)
        if not attempt:
            from app.shared.exceptions import NotFoundException
            raise NotFoundException("Attempt not found")
        if user_id and attempt.user_id != user_id:
             from app.shared.exceptions import AppException
             raise AppException("Not authorized to view this attempt", status_code=403)
        return attempt

    async def submit_attempt(self, attempt_id: uuid.UUID, user_id: uuid.UUID, submission: QuizSubmission) -> Attempt:
        """
        Validate timing, save answers, and execute scoring pipeline via SubmissionService.
        """
        attempt = await self.get_attempt(attempt_id, user_id)
        sub_service = SubmissionService(self.session)
        return await sub_service.submit(attempt, submission)

    async def list_user_attempts(self, user_id: uuid.UUID) -> Sequence[Attempt]:
        return await self.repository.list_by_user(user_id)

    async def save_answer(
        self,
        attempt_id: uuid.UUID,
        user_id: uuid.UUID,
        question_id: uuid.UUID,
        option_id: uuid.UUID
    ) -> bool:
        """
        Saves a single answer during an active attempt.
        """
        attempt = await self.get_attempt(attempt_id, user_id)

        if attempt.status != AttemptStatus.IN_PROGRESS:
            raise AppException("Cannot save answer for a finished attempt", status_code=400)

        if datetime.now(timezone.utc) > attempt.expires_at:
             raise AppException("Attempt has expired", status_code=400)

        # Update the specific AttemptQuestion snapshot
        from app.attempts.models import AttemptQuestion
        from sqlalchemy import update

        query = (
            update(AttemptQuestion)
            .where(AttemptQuestion.attempt_id == attempt_id)
            .where(AttemptQuestion.question_id == question_id)
            .values(selected_option_id=option_id)
        )
        await self.session.execute(query)
        return True
