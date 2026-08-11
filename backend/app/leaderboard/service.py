import uuid
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.leaderboard.repository import LeaderboardRepository


class LeaderboardService:
    """
    Service layer for fetching ranked student performance.
    """
    def __init__(self, session: AsyncSession):
        self.repository = LeaderboardRepository(session)

    async def get_quiz_rankings(self, quiz_id: uuid.UUID, limit: int = 10) -> List[Dict[str, Any]]:
        """Rankings for a specific assessment."""
        return await self.repository.get_quiz_leaderboard(quiz_id, limit)

    async def get_global_rankings(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Overall rankings across the platform."""
        return await self.repository.get_global_leaderboard(limit)

    async def get_user_rank(self, user_id: uuid.UUID) -> Optional[int]:
        """Get the global rank for a specific user."""
        return await self.repository.get_user_global_rank(user_id)
