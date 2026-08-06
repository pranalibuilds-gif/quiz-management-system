import uuid
from datetime import datetime, timezone
from typing import List, Sequence, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.attempts.models import Attempt, AttemptQuestion
from app.attempts.repository import AttemptRepository
from app.attempts.builder import AttemptBuilder
from app.attempts.scoring import AnswerEvaluator, ScoreCalculator, ResultGenerator
from app.attempts.schemas import QuizSubmission
from app.shared.enums import AttemptStatus
from app.shared.exceptions import AppException, NotFoundException


class AttemptService:
    """
    Service layer for Quiz Attempt lifecycle and scoring.
    """
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repository = AttemptRepository(session)

    async def start_attempt(self, user_id: uuid.UUID, quiz_id: uuid.UUID) -> Attempt:
        """Eligibility check and creation of a randomized attempt."""
        builder = AttemptBuilder(self.session)
        return await builder.build(user_id, quiz_id)

    async def get_attempt(self, attempt_id: uuid.UUID, user_id: Optional[uuid.UUID] = None) -> Attempt:
        """Fetch attempt or raise 404. Optionally restrict to a specific user."""
        attempt = await self.repository.get_with_details(attempt_id)
        if not attempt:
            raise NotFoundException("Attempt not found")
        if user_id and attempt.user_id != user_id:
             raise AppException("Not authorized to view this attempt", status_code=403)
        return attempt

    async def submit_attempt(self, attempt_id: uuid.UUID, user_id: uuid.UUID, submission: QuizSubmission) -> Attempt:
        """
        Validate timing, save answers, and execute scoring pipeline.
        """
        attempt = await self.get_attempt(attempt_id, user_id)

        # 1. Validation
        if attempt.status != AttemptStatus.IN_PROGRESS:
            raise AppException("This attempt has already been submitted", status_code=400)

        now = datetime.now(timezone.utc)
        if now > attempt.expires_at:
            attempt.status = AttemptStatus.AUTO_SUBMITTED
            # Even if late, we process the answers provided or treat as 0?
            # Business Rule: Treat as submitted but mark as AUTO_SUBMITTED.
        else:
            attempt.status = AttemptStatus.SUBMITTED

        # 2. Record Answers
        submission_map = {ans.question_id: ans.option_id for ans in submission.answers}
        for q in attempt.questions:
            if q.question_id in submission_map:
                q.selected_option_id = submission_map[q.question_id]

        # 3. Scoring Pipeline
        evaluator = AnswerEvaluator()
        evaluations = []
        total_possible = 0.0

        for q in attempt.questions:
            is_correct, is_unanswered = evaluator.evaluate(q)
            evaluations.append((q, is_correct, is_unanswered))
            total_possible += q.marks

        calculator = ScoreCalculator(attempt.negative_marking)
        score, correct, incorrect, unanswered = calculator.calculate(evaluations)

        percentage, is_passed = ResultGenerator.generate(score, total_possible, attempt.passing_percentage)

        # 4. Finalize Attempt
        attempt.score = score
        attempt.percentage = percentage
        attempt.correct_answers = correct
        attempt.incorrect_answers = incorrect
        attempt.unanswered_answers = unanswered
        attempt.submitted_at = now
        attempt.time_taken_seconds = int((now - attempt.started_at).total_seconds())

        return attempt

    async def list_user_attempts(self, user_id: uuid.UUID) -> Sequence[Attempt]:
        return await self.repository.list_by_user(user_id)
