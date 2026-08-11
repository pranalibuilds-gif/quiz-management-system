import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from app.shared.enums import QuizStatus, AttemptStatus


class SystemOverview(BaseModel):
    total_students: int
    total_quizzes: int
    published_quizzes: int
    active_attempts: int
    completed_attempts: int
    average_percentage: float


class RecentActivity(BaseModel):
    id: str # Can be UUID or dynamic ID
    type: str # 'REGISTRATION', 'SUBMISSION', 'QUIZ_PUBLISHED'
    title: str
    description: str
    timestamp: datetime


class AdminDashboardData(BaseModel):
    overview: SystemOverview
    recent_activity: List[RecentActivity]
