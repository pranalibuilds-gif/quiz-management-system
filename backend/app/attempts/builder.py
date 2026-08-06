import uuid
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.quizzes.models import Quiz
from app.questions.models import Question
from app.attempts.models import Attempt, AttemptQuestion, AttemptOption
from app.attempts.randomization import RandomizationService
from app.shared.enums import QuizStatus, AttemptStatus
from app.shared.exceptions import AppException, NotFoundException


class AttemptBuilder:
    """
    Orchestrates the creation of a new quiz attempt with snapshots and randomization.
    """

    def __init__(self, session: AsyncSession):
        self.session = session

    async def build(self, user_id: uuid.UUID, quiz_id: uuid.UUID) -> Attempt:
        """
        Main entry point to create a full attempt structure.
        """
        # 1. Fetch Quiz with questions and options
        quiz = await self._get_quiz_ready_for_attempt(quiz_id)

        # 2. Eligibility Checks
        await self._check_eligibility(user_id, quiz)

        # 3. Randomization Setup
        seed = RandomizationService.generate_seed()

        # 4. Create Attempt Header
        started_at = datetime.now(timezone.utc)
        expires_at = started_at + timedelta(minutes=quiz.duration_minutes)

        attempt = Attempt(
            user_id=user_id,
            quiz_id=quiz_id,
            quiz_version=quiz.version,
            quiz_title=quiz.title,
            passing_percentage=quiz.passing_percentage,
            negative_marking=quiz.negative_marking,
            duration_minutes=quiz.duration_minutes,
            status=AttemptStatus.IN_PROGRESS,
            started_at=started_at,
            expires_at=expires_at,
            random_seed=seed,
            total_questions=len(quiz.questions)
        )
        self.session.add(attempt)
        await self.session.flush()

        # 5. Shuffle Questions
        shuffled_questions = RandomizationService.shuffle_list(quiz.questions, f"{seed}-q")

        # 6. Create Snapshots (Questions & Options)
        for idx, q in enumerate(shuffled_questions):
            attempt_q = AttemptQuestion(
                attempt_id=attempt.id,
                question_id=q.id,
                question_text=q.text,
                explanation=q.explanation,
                marks=q.marks,
                question_order=idx + 1
            )
            self.session.add(attempt_q)
            await self.session.flush()

            # Shuffle Options per question
            shuffled_options = RandomizationService.shuffle_list(q.options, f"{seed}-o-{q.id}")
            for opt_idx, opt in enumerate(shuffled_options):
                attempt_opt = AttemptOption(
                    attempt_question_id=attempt_q.id,
                    option_id=opt.id,
                    option_text=opt.text,
                    is_correct=opt.is_correct,
                    display_order=opt_idx + 1
                )
                self.session.add(attempt_opt)

        await self.session.flush()
        return attempt

    async def _get_quiz_ready_for_attempt(self, quiz_id: uuid.UUID) -> Quiz:
        query = (
            select(Quiz)
            .where(Quiz.id == quiz_id)
            .where(Quiz.deleted_at == None)
            .options(
                selectinload(Quiz.questions).selectinload(Question.options)
            )
        )
        result = await self.session.execute(query)
        quiz = result.scalar_one_or_none()

        if not quiz:
            raise NotFoundException("Quiz not found")
        if quiz.status != QuizStatus.PUBLISHED:
            raise AppException("This quiz is not currently open for attempts", status_code=400)
        if len(quiz.questions) == 0:
            raise AppException("This quiz has no questions", status_code=400)

        return quiz

    async def _check_eligibility(self, user_id: uuid.UUID, quiz: Quiz):
        # 1. Check max attempts
        query = (
            select(func.count(Attempt.id))
            .where(Attempt.user_id == user_id)
            .where(Attempt.quiz_id == quiz.id)
            .where(Attempt.status != AttemptStatus.IN_PROGRESS) # Only completed attempts count?
            # Actually PUD says "maximum attempts". Usually means total attempts started.
        )
        result = await self.session.execute(query)
        count = result.scalar()

        if count >= quiz.maximum_attempts:
            raise AppException(f"Maximum attempt limit ({quiz.maximum_attempts}) reached for this quiz", status_code=403)

        # 2. Check for active In-Progress attempt
        query_active = (
            select(Attempt)
            .where(Attempt.user_id == user_id)
            .where(Attempt.quiz_id == quiz.id)
            .where(Attempt.status == AttemptStatus.IN_PROGRESS)
        )
        result_active = await self.session.execute(query_active)
        if result_active.scalar_one_or_none():
            raise AppException("You already have an active attempt for this quiz", status_code=400)
