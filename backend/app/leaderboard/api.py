import uuid
from typing import Annotated, List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.leaderboard.service import LeaderboardService
from app.core.dependencies import get_current_user
from app.shared.schemas import APIResponse

router = APIRouter()


@router.get("/quiz/{quiz_id}", response_model=APIResponse[List[Dict[str, Any]]])
async def get_quiz_leaderboard(
    session: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[Any, Depends(get_current_user)],
    quiz_id: uuid.UUID,
    limit: int = 10
):
    """Public/Student: Rankings for a specific quiz."""
    service = LeaderboardService(session)
    rankings = await service.get_quiz_rankings(quiz_id, limit)

    return APIResponse(
        success=True,
        message="Quiz leaderboard fetched",
        data=rankings
    )


@router.get("/global", response_model=APIResponse[List[Dict[str, Any]]])
async def get_global_leaderboard(
    session: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[Any, Depends(get_current_user)],
    limit: int = 10
):
    """Public/Student: Global student rankings."""
    service = LeaderboardService(session)
    rankings = await service.get_global_rankings(limit)

    return APIResponse(
        success=True,
        message="Global leaderboard fetched",
        data=rankings
    )
