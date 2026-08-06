import uuid
from typing import Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from app.analytics.repository import AnalyticsRepository


class AnalyticsService:
    """
    Service layer to interpret and provide dashboard-ready analytics.
    """
    def __init__(self, session: AsyncSession):
        self.repository = AnalyticsRepository(session)

    async def get_admin_dashboard(self) -> Dict[str, Any]:
        """Fetches system-wide overview for Admin Dashboard."""
        return await self.repository.get_system_overview()

    async def get_quiz_analytics(self, quiz_id: uuid.UUID) -> Dict[str, Any]:
        """Combines quiz performance and per-question statistics."""
        performance = await self.repository.get_quiz_performance(quiz_id)
        questions = await self.repository.get_question_stats(quiz_id)

        return {
            "performance": performance,
            "questions": questions
        }
