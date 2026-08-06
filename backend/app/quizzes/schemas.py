from typing import Optional
import uuid
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from app.shared.enums import QuizStatus, DifficultyLevel


class QuizBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    category_id: Optional[uuid.UUID] = None
    duration_minutes: int = Field(30, ge=1, le=480)
    passing_percentage: int = Field(40, ge=0, le=100)
    maximum_attempts: int = Field(1, ge=1, le=10)
    negative_marking: float = Field(0.0, ge=0.0, le=10.0)
    difficulty: DifficultyLevel = DifficultyLevel.MEDIUM
    randomize_questions: bool = True
    randomize_options: bool = True


class QuizCreate(QuizBase):
    pass


class QuizUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    category_id: Optional[uuid.UUID] = None
    duration_minutes: Optional[int] = Field(None, ge=1, le=480)
    passing_percentage: Optional[int] = Field(None, ge=0, le=100)
    maximum_attempts: Optional[int] = Field(None, ge=1, le=10)
    negative_marking: Optional[float] = Field(None, ge=0.0, le=10.0)
    difficulty: Optional[DifficultyLevel] = None
    randomize_questions: Optional[bool] = None
    randomize_options: Optional[bool] = None
    thumbnail_path: Optional[str] = None


class QuizRead(QuizBase):
    id: uuid.UUID
    version: int
    status: QuizStatus
    thumbnail_path: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class QuizStatusUpdate(BaseModel):
    status: QuizStatus
