import uuid
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class OptionBase(BaseModel):
    text: str = Field(..., min_length=1, max_length=500)
    is_correct: bool = False


class OptionCreate(OptionBase):
    pass


class OptionUpdate(BaseModel):
    text: Optional[str] = Field(None, min_length=1, max_length=500)
    is_correct: Optional[bool] = None


class OptionRead(OptionBase):
    id: uuid.UUID
    question_id: uuid.UUID

    model_config = ConfigDict(from_attributes=True)


class QuestionBase(BaseModel):
    text: str = Field(..., min_length=1, max_length=1000)
    explanation: Optional[str] = Field(None, max_length=1000)
    marks: float = Field(1.0, ge=0.5, le=100.0)
    order: int = Field(0, ge=0)


class QuestionCreate(QuestionBase):
    options: List[OptionCreate] = Field(..., min_items=2, max_items=10)


class QuestionUpdate(BaseModel):
    text: Optional[str] = Field(None, min_length=1, max_length=1000)
    explanation: Optional[str] = Field(None, max_length=1000)
    marks: Optional[float] = Field(None, ge=0.5, le=100.0)
    order: Optional[int] = Field(None, ge=0)


class QuestionRead(QuestionBase):
    id: uuid.UUID
    quiz_id: uuid.UUID
    created_at: datetime
    options: List[OptionRead]

    model_config = ConfigDict(from_attributes=True)
