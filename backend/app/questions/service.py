import uuid
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.questions.models import Question, Option
from app.questions.repository import QuestionRepository, OptionRepository
from app.questions.schemas import QuestionCreate, QuestionUpdate, OptionUpdate
from app.questions.validators import QuestionValidator
from app.shared.exceptions import NotFoundException


class QuestionService:
    """
    Service layer for Question and Option business logic.
    """
    def __init__(self, session: AsyncSession):
        self.session = session
        self.question_repo = QuestionRepository(session)
        self.option_repo = OptionRepository(session)

    async def add_question_to_quiz(self, quiz_id: uuid.UUID, question_in: QuestionCreate) -> Question:
        """
        Validate and add a new question with options to a quiz.
        """
        # 1. Domain Validation
        QuestionValidator.validate_options([opt.model_dump() for opt in question_in.options])
        QuestionValidator.validate_marks(question_in.marks)

        # 2. Create Question
        db_question = Question(
            quiz_id=quiz_id,
            text=question_in.text,
            explanation=question_in.explanation,
            marks=question_in.marks,
            order=question_in.order
        )
        self.session.add(db_question)
        await self.session.flush()

        # 3. Create Options
        for opt_in in question_in.options:
            db_option = Option(
                question_id=db_question.id,
                text=opt_in.text,
                is_correct=opt_in.is_correct
            )
            self.session.add(db_option)

        await self.session.flush()
        return db_question

    async def get_question(self, question_id: uuid.UUID) -> Question:
        """Fetch question or raise 404."""
        question = await self.question_repo.get_by_id(question_id)
        if not question or question.deleted_at:
            raise NotFoundException("Question not found")
        return question

    async def list_quiz_questions(self, quiz_id: uuid.UUID) -> List[Question]:
        """List all questions for a quiz."""
        return await self.question_repo.get_by_quiz_id(quiz_id)

    async def update_question(self, question_id: uuid.UUID, question_in: QuestionUpdate) -> Question:
        """Update question metadata."""
        await self.get_question(question_id)
        update_data = question_in.model_dump(exclude_unset=True)
        return await self.question_repo.update(question_id, **update_data)

    async def update_option(self, option_id: uuid.UUID, option_in: OptionUpdate) -> Option:
        """Update a specific option."""
        db_option = await self.option_repo.get_by_id(option_id)
        if not db_option:
            raise NotFoundException("Option not found")

        update_data = option_in.model_dump(exclude_unset=True)
        return await self.option_repo.update(option_id, **update_data)

    async def delete_question(self, question_id: uuid.UUID) -> bool:
        """Soft delete a question."""
        await self.get_question(question_id)
        return await self.question_repo.soft_delete(question_id)
