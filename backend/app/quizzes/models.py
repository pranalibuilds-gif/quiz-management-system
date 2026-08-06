import uuid
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Integer, Float, Boolean, ForeignKey, Enum as SAEnum, Uuid, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base_model import FullBase
from app.shared.enums import QuizStatus, DifficultyLevel

if TYPE_CHECKING:
    from app.categories.models import Category
    from app.questions.models import Question


class Quiz(FullBase):
    """
    Core Quiz entity containing configuration and metadata.
    Supports versioning and publishing lifecycle.
    """
    __tablename__ = "quizzes"

    title: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    category_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("categories.id", ondelete="SET NULL"),
        nullable=True
    )

    # Versioning & Status
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    status: Mapped[QuizStatus] = mapped_column(
        SAEnum(QuizStatus, name="quiz_status"),
        default=QuizStatus.DRAFT,
        nullable=False
    )

    # Configuration
    duration_minutes: Mapped[int] = mapped_column(Integer, default=30, nullable=False)
    passing_percentage: Mapped[int] = mapped_column(Integer, default=40, nullable=False)
    maximum_attempts: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    negative_marking: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    difficulty: Mapped[DifficultyLevel] = mapped_column(
        SAEnum(DifficultyLevel, name="difficulty_level"),
        default=DifficultyLevel.MEDIUM,
        nullable=False
    )

    # Behavior
    randomize_questions: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    randomize_options: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Assets
    thumbnail_path: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Lifecycle tracking
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    archived_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    category: Mapped[Optional["Category"]] = relationship(back_populates="quizzes")
    questions: Mapped[List["Question"]] = relationship(back_populates="quiz", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Quiz(id={self.id}, title={self.title}, status={self.status}, version={self.version})>"
