import uuid
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.shared.repository import BaseRepository
from app.questions.models import Question, Option


class QuestionRepository(BaseRepository[Question]):
    """
    Repository for Question-specific database operations.
    """
    def __init__(self, session: AsyncSession):
        super().__init__(Question, session)

    async def get_by_quiz_id(self, quiz_id: uuid.UUID) -> List[Question]:
        """Fetch all questions for a specific quiz, ordered by 'order' field."""
        query = (
            select(Question)
            .where(Question.quiz_id == quiz_id)
            .where(Question.deleted_at == None)
            .order_by(Question.order.asc(), Question.created_at.asc())
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())


class OptionRepository(BaseRepository[Option]):
    """
    Repository for Option-specific database operations.
    """
    def __init__(self, session: AsyncSession):
        super().__init__(Option, session)

    async def get_by_question_id(self, question_id: uuid.UUID) -> List[Option]:
        """Fetch all options for a specific question."""
        query = (
            select(Option)
            .where(Option.question_id == question_id)
            .where(Option.deleted_at == None)
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())
