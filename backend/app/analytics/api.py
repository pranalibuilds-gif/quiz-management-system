import uuid
from typing import Annotated, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.analytics.service import AnalyticsService
from app.analytics.schemas import AdminDashboardData
from app.core.dependencies import get_current_admin
from app.users.models import User
from app.shared.schemas import APIResponse

router = APIRouter()


@router.get("/overview", response_model=APIResponse[AdminDashboardData])
async def get_system_overview(
    session: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[User, Depends(get_current_admin)]
):
    """Admin only: System-wide statistics and recent activity for the dashboard."""
    service = AnalyticsService(session)
    data = await service.get_admin_dashboard()

    return APIResponse(
        success=True,
        message="Admin dashboard data fetched",
        data=data
    )


@router.get("/quiz/{quiz_id}", response_model=APIResponse[Dict[str, Any]])
async def get_quiz_analytics(
    session: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[User, Depends(get_current_admin)],
    quiz_id: uuid.UUID
):
    """Admin only: Detailed analytics for a specific quiz, including question performance."""
    service = AnalyticsService(session)
    stats = await service.get_quiz_analytics(quiz_id)

    return APIResponse(
        success=True,
        message="Quiz analytics fetched",
        data=stats
    )
