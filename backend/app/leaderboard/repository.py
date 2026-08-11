import uuid
from typing import List, Dict, Any
from sqlalchemy import select, func, desc, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.attempts.models import Attempt
from app.users.models import User
from app.shared.enums import AttemptStatus


class LeaderboardRepository:
    """
    Handles optimized queries for ranking students based on performance.
    """
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_quiz_leaderboard(self, quiz_id: uuid.UUID, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Rank users by their best score in a specific quiz.
        Ties are broken by time taken (lower is better).
        """
        # Subquery to find the best attempt per user for this quiz
        best_attempts_sub = (
            select(
                Attempt.user_id,
                func.max(Attempt.score).label("max_score")
            )
            .where(Attempt.quiz_id == quiz_id)
            .where(Attempt.status.in_([AttemptStatus.SUBMITTED, AttemptStatus.AUTO_SUBMITTED]))
            .group_by(Attempt.user_id)
            .subquery()
        )

        # Join with Attempt and User to get details
        query = (
            select(
                User.full_name,
                User.username,
                Attempt.score,
                Attempt.percentage,
                Attempt.time_taken_seconds,
                Attempt.submitted_at
            )
            .join(User, User.id == Attempt.user_id)
            .join(
                best_attempts_sub,
                and_(
                    Attempt.user_id == best_attempts_sub.c.user_id,
                    Attempt.score == best_attempts_sub.c.max_score
                )
            )
            .where(Attempt.quiz_id == quiz_id)
            .order_by(desc(Attempt.score), Attempt.time_taken_seconds.asc())
            .limit(limit)
            .distinct(Attempt.user_id) # Ensure one entry per user if they have multiple attempts with same max score
        )

        result = await self.session.execute(query)
        leaderboard = []
        for idx, row in enumerate(result.mappings()):
            leaderboard.append({
                "rank": idx + 1,
                "name": row["full_name"],
                "username": row["username"],
                "score": row["score"],
                "percentage": row["percentage"],
                "time_taken": row["time_taken_seconds"],
                "achieved_at": row["submitted_at"]
            })
        return leaderboard

    async def get_global_leaderboard(self, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Rank users by average score across all quizzes.
        """
        query = (
            select(
                User.full_name,
                User.username,
                func.avg(Attempt.percentage).label("avg_percentage"),
                func.count(Attempt.id).label("quizzes_passed")
            )
            .join(Attempt, Attempt.user_id == User.id)
            .where(Attempt.status.in_([AttemptStatus.SUBMITTED, AttemptStatus.AUTO_SUBMITTED]))
            .group_by(User.id)
            .order_by(desc(func.avg(Attempt.percentage)))
            .limit(limit)
        )

        result = await self.session.execute(query)
        return [
            {
                "rank": idx + 1,
                "name": row["full_name"],
                "username": row["username"],
                "average_percentage": round(float(row["avg_percentage"]), 2),
                "total_attempts": row["quizzes_passed"]
            }
            for idx, row in enumerate(result.mappings())
        ]

    async def get_user_global_rank(self, user_id: uuid.UUID) -> Optional[int]:
        """
        Calculate the global rank of a specific user.
        """
        # Subquery to calculate average percentage for all users
        stats_sub = (
            select(
                User.id,
                func.avg(Attempt.percentage).label("avg_percentage")
            )
            .join(Attempt, Attempt.user_id == User.id)
            .where(Attempt.status.in_([AttemptStatus.SUBMITTED, AttemptStatus.AUTO_SUBMITTED]))
            .group_by(User.id)
            .subquery()
        )

        # Get the average for our user
        user_avg_query = select(stats_sub.c.avg_percentage).where(stats_sub.c.id == user_id)
        result = await self.session.execute(user_avg_query)
        user_avg = result.scalar()

        if user_avg is None:
            return None

        # Count how many users have a higher average percentage
        rank_query = (
            select(func.count(stats_sub.c.id))
            .where(stats_sub.c.avg_percentage > user_avg)
        )
        higher_users_count = await self.session.execute(rank_query)
        return higher_users_count.scalar() + 1
