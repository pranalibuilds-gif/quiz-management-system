import uuid
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Float, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base_model import FullBase

if TYPE_CHECKING:
    from app.quizzes.models import Quiz


class Question(FullBase):
    """
    Represents a single question within a quiz.
    """
    __tablename__ = "questions"

    quiz_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("quizzes.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    text: Mapped[str] = mapped_column(String(1000), nullable=False)
    explanation: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    marks: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Relationships
    quiz: Mapped["Quiz"] = relationship(back_populates="questions")
    options: Mapped[List["Option"]] = relationship(
        back_populates="question",
        cascade="all, delete-orphan",
        order_by="Option.text" # Default sorting
    )

    def __repr__(self) -> str:
        return f"<Question(id={self.id}, text={self.text[:30]}...)>"


class Option(FullBase):
    """
    Represents a possible answer for a question.
    """
    __tablename__ = "options"

    question_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("questions.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    text: Mapped[str] = mapped_column(String(500), nullable=False)
    is_correct: Mapped[bool] = mapped_column(default=False, nullable=False)

    # Relationships
    question: Mapped["Question"] = relationship(back_populates="options")

    def __repr__(self) -> str:
        return f"<Option(id={self.id}, correct={self.is_correct}, text={self.text[:30]}...)>"
