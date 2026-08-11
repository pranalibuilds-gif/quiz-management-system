import uuid
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession

from app.attempts.models import Attempt
from app.attempts.scoring import AnswerEvaluator, ScoreCalculator, ResultGenerator
from app.attempts.schemas import QuizSubmission
from app.shared.enums import AttemptStatus
from app.shared.exceptions import AppException
from app.core.logging import logger


class SubmissionService:
    """
    Handles the validation, saving, and scoring of quiz submissions.
    """
    def __init__(self, session: AsyncSession):
        self.session = session

    async def submit(self, attempt: Attempt, submission: QuizSubmission) -> Attempt:
        """
        Processes the submission: validates timing, records answers, and calculates score.
        """
        # 1. Validation
        if attempt.status != AttemptStatus.IN_PROGRESS:
            raise AppException("This attempt has already been submitted", status_code=400)

        now = datetime.now(timezone.utc)
        if now > attempt.expires_at:
            attempt.status = AttemptStatus.AUTO_SUBMITTED
        else:
            attempt.status = AttemptStatus.SUBMITTED

        # 2. Record Answers (Updating AttemptQuestion snapshots)
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

        # 4. Finalize Attempt Metadata
        attempt.score = score
        attempt.percentage = percentage
        attempt.correct_answers = correct
        attempt.incorrect_answers = incorrect
        attempt.unanswered_answers = unanswered
        attempt.submitted_at = now
        attempt.time_taken_seconds = int((now - attempt.started_at).total_seconds())

        logger.info(f"Attempt submitted and scored: ID={attempt.id}, User={attempt.user_id}, Status={attempt.status}, Score={attempt.score}/{total_possible}")

        return attempt
