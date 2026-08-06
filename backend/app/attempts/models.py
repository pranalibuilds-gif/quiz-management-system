import uuid
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Integer, Float, ForeignKey, DateTime, Enum as SAEnum, Uuid, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base_model import IDMixin, Base
from app.shared.enums import AttemptStatus

if TYPE_CHECKING:
    from app.users.models import User
    from app.quizzes.models import Quiz


class Attempt(Base, IDMixin):
    """
    Represents a student's attempt at a quiz.
    Stores a snapshot of quiz configuration for historical accuracy.
    """
    __tablename__ = "attempts"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    quiz_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("quizzes.id"), nullable=False, index=True)

    # Snapshot of quiz data
    quiz_version: Mapped[int] = mapped_column(Integer, nullable=False)
    quiz_title: Mapped[str] = mapped_column(String(100), nullable=False)
    passing_percentage: Mapped[int] = mapped_column(Integer, nullable=False)
    negative_marking: Mapped[float] = mapped_column(Float, nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)

    status: Mapped[AttemptStatus] = mapped_column(
        SAEnum(AttemptStatus, name="attempt_status"),
        default=AttemptStatus.IN_PROGRESS,
        nullable=False,
        index=True
    )

    # Results
    score: Mapped[float] = mapped_column(Float, default=0.0)
    percentage: Mapped[float] = mapped_column(Float, default=0.0)
    correct_answers: Mapped[int] = mapped_column(Integer, default=0)
    incorrect_answers: Mapped[int] = mapped_column(Integer, default=0)
    unanswered_answers: Mapped[int] = mapped_column(Integer, default=0)
    total_questions: Mapped[int] = mapped_column(Integer, default=0)

    # Timing
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    submitted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    time_taken_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    random_seed: Mapped[str] = mapped_column(String(50), nullable=False)

    # Relationships
    questions: Mapped[List["AttemptQuestion"]] = relationship(
        back_populates="attempt",
        cascade="all, delete-orphan",
        order_by="AttemptQuestion.question_order"
    )

    # Unique constraint to prevent multiple active attempts per user per quiz
    __table_args__ = (
        Index(
            "ix_active_attempt_unique",
            "user_id",
            "quiz_id",
            unique=True,
            postgresql_where=(status == AttemptStatus.IN_PROGRESS),
        ),
    )

    def __repr__(self) -> str:
        return f"<Attempt(id={self.id}, user_id={self.user_id}, status={self.status})>"


class AttemptQuestion(Base, IDMixin):
    """
    Snapshot of a question within an attempt.
    """
    __tablename__ = "attempt_questions"

    attempt_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("attempts.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("questions.id"), nullable=False)

    # Snapshot of question data
    question_text: Mapped[str] = mapped_column(String(1000), nullable=False)
    explanation: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    marks: Mapped[float] = mapped_column(Float, nullable=False)

    question_order: Mapped[int] = mapped_column(Integer, nullable=False)
    selected_option_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid(as_uuid=True), nullable=True)

    # Relationships
    attempt: Mapped["Attempt"] = relationship(back_populates="questions")
    options: Mapped[List["AttemptOption"]] = relationship(
        back_populates="attempt_question",
        cascade="all, delete-orphan",
        order_by="AttemptOption.display_order"
    )

    def __repr__(self) -> str:
        return f"<AttemptQuestion(id={self.id}, order={self.question_order})>"


class AttemptOption(Base, IDMixin):
    """
    Snapshot of an option within an attempt.
    """
    __tablename__ = "attempt_options"

    attempt_question_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("attempt_questions.id", ondelete="CASCADE"), nullable=False, index=True)
    option_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("options.id"), nullable=False)

    # Snapshot of option data
    option_text: Mapped[str] = mapped_column(String(500), nullable=False)
    is_correct: Mapped[bool] = mapped_column(default=False, nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False)

    # Relationships
    attempt_question: Mapped["AttemptQuestion"] = relationship(back_populates="options")

    def __repr__(self) -> str:
        return f"<AttemptOption(id={self.id}, text={self.option_text[:20]}...)>"
