import uuid
from typing import Optional, Sequence
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.shared.repository import BaseRepository
from app.attempts.models import Attempt, AttemptQuestion


class AttemptRepository(BaseRepository[Attempt]):
    """
    Repository for Attempt-specific database operations.
    """
    def __init__(self, session: AsyncSession):
        super().__init__(Attempt, session)

    async def get_with_details(self, attempt_id: uuid.UUID) -> Optional[Attempt]:
        """Fetch attempt with questions and options loaded."""
        query = (
            select(Attempt)
            .where(Attempt.id == attempt_id)
            .options(
                selectinload(Attempt.questions).selectinload(AttemptQuestion.options)
            )
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def list_by_user(self, user_id: uuid.UUID, skip: int = 0, limit: int = 100) -> Sequence[Attempt]:
        """Fetch all attempts for a specific user."""
        query = (
            select(Attempt)
            .where(Attempt.user_id == user_id)
            .order_by(Attempt.started_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.session.execute(query)
        return result.scalars().all()
