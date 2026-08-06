from typing import Optional, Sequence, List
import uuid
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.shared.repository import BaseRepository
from app.quizzes.models import Quiz
from app.shared.enums import QuizStatus


class QuizRepository(BaseRepository[Quiz]):
    """
    Repository for Quiz-specific database operations.
    """
    def __init__(self, session: AsyncSession):
        super().__init__(Quiz, session)

    async def list_published(
        self,
        category_id: Optional[uuid.UUID] = None,
        skip: int = 0,
        limit: int = 100
    ) -> Sequence[Quiz]:
        """Fetch all published and non-deleted quizzes, optionally by category."""
        query = (
            select(Quiz)
            .where(Quiz.status == QuizStatus.PUBLISHED)
            .where(Quiz.deleted_at == None)
        )

        if category_id:
            query = query.where(Quiz.category_id == category_id)

        query = query.offset(skip).limit(limit)
        result = await self.session.execute(query)
        return result.scalars().all()

    async def get_by_title(self, title: str) -> Optional[Quiz]:
        """Fetch a quiz by its title (useful for uniqueness checks or search)."""
        query = select(Quiz).where(Quiz.title == title)
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def list_by_status(self, status: QuizStatus, skip: int = 0, limit: int = 100) -> Sequence[Quiz]:
        """Fetch quizzes filtered by status (Admin view)."""
        query = select(Quiz).where(Quiz.status == status).offset(skip).limit(limit)
        result = await self.session.execute(query)
        return result.scalars().all()
