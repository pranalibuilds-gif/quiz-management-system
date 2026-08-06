import uuid
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.shared.enums import AttemptStatus


class AttemptOptionRead(BaseModel):
    id: uuid.UUID
    option_id: uuid.UUID
    option_text: str
    display_order: int

    model_config = ConfigDict(from_attributes=True)


class AttemptQuestionRead(BaseModel):
    id: uuid.UUID
    question_id: uuid.UUID
    question_text: str
    marks: float
    question_order: int
    selected_option_id: Optional[uuid.UUID] = None
    options: List[AttemptOptionRead]

    # explanation is hidden until after 24h/review period
    explanation: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class AttemptRead(BaseModel):
    id: uuid.UUID
    quiz_id: uuid.UUID
    quiz_title: str
    status: AttemptStatus
    started_at: datetime
    expires_at: datetime
    total_questions: int

    # Results only visible when submitted
    score: Optional[float] = None
    percentage: Optional[float] = None
    correct_answers: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class AttemptFullRead(AttemptRead):
    questions: List[AttemptQuestionRead]


class AnswerSubmission(BaseModel):
    question_id: uuid.UUID
    option_id: uuid.UUID


class QuizSubmission(BaseModel):
    answers: List[AnswerSubmission]
