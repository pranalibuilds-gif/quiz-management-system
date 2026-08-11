import uuid
from typing import Dict, Any, List
from sqlalchemy import select, func, desc, join
from sqlalchemy.ext.asyncio import AsyncSession

from app.attempts.models import Attempt, AttemptQuestion, AttemptOption
from app.quizzes.models import Quiz
from app.users.models import User
from app.shared.enums import AttemptStatus, UserRole, QuizStatus


class AnalyticsRepository:
    """
    Handles complex aggregation queries for system-wide and user-specific analytics.
    """
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_system_overview(self) -> Dict[str, Any]:
        """Calculates high-level system statistics using efficient DB aggregates."""
        # 1. Counts
        students_q = select(func.count(User.id)).where(User.role == UserRole.STUDENT)
        quizzes_q = select(func.count(Quiz.id))
        published_q = select(func.count(Quiz.id)).where(Quiz.status == QuizStatus.PUBLISHED)
        active_att_q = select(func.count(Attempt.id)).where(Attempt.status == AttemptStatus.IN_PROGRESS)
        completed_att_q = select(func.count(Attempt.id)).where(Attempt.status.in_([AttemptStatus.SUBMITTED, AttemptStatus.AUTO_SUBMITTED]))

        # 2. Avg Percentage
        avg_score_q = select(func.avg(Attempt.percentage)).where(
            Attempt.status.in_([AttemptStatus.SUBMITTED, AttemptStatus.AUTO_SUBMITTED])
        )

        # Execute all efficiently
        total_students = (await self.session.execute(students_q)).scalar() or 0
        total_quizzes = (await self.session.execute(quizzes_q)).scalar() or 0
        published_quizzes = (await self.session.execute(published_q)).scalar() or 0
        active_attempts = (await self.session.execute(active_att_q)).scalar() or 0
        completed_attempts = (await self.session.execute(completed_att_q)).scalar() or 0
        average_percentage = (await self.session.execute(avg_score_q)).scalar() or 0

        return {
            "total_students": total_students,
            "total_quizzes": total_quizzes,
            "published_quizzes": published_quizzes,
            "active_attempts": active_attempts,
            "completed_attempts": completed_attempts,
            "average_percentage": round(float(average_percentage), 2)
        }

    async def get_recent_activity(self, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Combines recent registrations, submissions, and quiz publications.
        """
        # 1. Recent Registrations
        recent_users = (await self.session.execute(
            select(User.id, User.full_name, User.created_at)
            .where(User.role == UserRole.STUDENT)
            .order_by(desc(User.created_at))
            .limit(limit)
        )).mappings().all()

        # 2. Recent Submissions
        recent_attempts = (await self.session.execute(
            select(Attempt.id, Attempt.quiz_title, User.full_name, Attempt.submitted_at, Attempt.status)
            .join(User, User.id == Attempt.user_id)
            .where(Attempt.status.in_([AttemptStatus.SUBMITTED, AttemptStatus.AUTO_SUBMITTED]))
            .order_by(desc(Attempt.submitted_at))
            .limit(limit)
        )).mappings().all()

        activity = []

        for u in recent_users:
            activity.append({
                "id": f"reg-{u['id']}",
                "type": "REGISTRATION",
                "title": "New Student Registered",
                "description": f"{u['full_name']} joined the platform.",
                "timestamp": u['created_at']
            })

        for a in recent_attempts:
            activity.append({
                "id": f"sub-{a['id']}",
                "type": "SUBMISSION",
                "title": "Quiz Submitted",
                "description": f"{a['full_name']} completed '{a['quiz_title']}' ({a['status'].replace('_', ' ')})",
                "timestamp": a['submitted_at']
            })

        # Sort combined activity by timestamp descending
        activity.sort(key=lambda x: x["timestamp"], reverse=True)
        return activity[:limit]

    async def get_quiz_performance(self, quiz_id: uuid.UUID) -> Dict[str, Any]:
        """Calculates performance metrics for a specific quiz."""
        stats = await self.session.execute(
            select(
                func.count(Attempt.id).label("total_attempts"),
                func.avg(Attempt.percentage).label("avg_percentage"),
                func.max(Attempt.score).label("highest_score")
            )
            .where(Attempt.quiz_id == quiz_id)
            .where(Attempt.status.in_([AttemptStatus.SUBMITTED, AttemptStatus.AUTO_SUBMITTED]))
        )
        res = stats.mappings().first()

        return {
            "total_attempts": res["total_attempts"] or 0,
            "average_percentage": round(float(res["avg_percentage"] or 0), 2),
            "highest_score": float(res["highest_score"] or 0)
        }

    async def get_question_stats(self, quiz_id: uuid.UUID) -> List[Dict[str, Any]]:
        """
        Calculates success rates for each question in a quiz.
        Uses relational snapshots for historical accuracy.
        """
        # Subquery to filter attempts for this quiz
        attempts_sub = select(Attempt.id).where(Attempt.quiz_id == quiz_id).subquery()

        # Join AttemptQuestion with AttemptOption to identify correct answers
        query = (
            select(
                AttemptQuestion.question_id,
                AttemptQuestion.question_text,
                func.count(AttemptQuestion.id).label("total_responses"),
                func.sum(
                    func.case(
                        (AttemptOption.is_correct == True, 1),
                        else_=0
                    )
                ).label("correct_responses")
            )
            .join(AttemptOption,
                  (AttemptOption.attempt_question_id == AttemptQuestion.id) &
                  (AttemptOption.option_id == AttemptQuestion.selected_option_id),
                  isouter=True
            )
            .where(AttemptQuestion.attempt_id.in_(select(attempts_sub)))
            .group_by(AttemptQuestion.question_id, AttemptQuestion.question_text)
        )

        result = await self.session.execute(query)
        stats = []
        for row in result.mappings():
            total = row["total_responses"] or 0
            correct = row["correct_responses"] or 0
            stats.append({
                "question_id": row["question_id"],
                "text": row["question_text"],
                "total_responses": total,
                "correct_responses": int(correct),
                "success_rate": round((correct / total * 100), 2) if total > 0 else 0
            })
        return stats
