from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base_model import FullBase

if TYPE_CHECKING:
    from app.quizzes.models import Quiz


class Category(FullBase):
    """
    Groups quizzes into logical domains (e.g., Programming, Aptitude).
    Inherits from FullBase: id, timestamps, soft delete, audit.
    """
    __tablename__ = "categories"

    name: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(60), unique=True, index=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships - No hard delete cascade due to soft-delete architecture
    quizzes: Mapped[List["Quiz"]] = relationship(back_populates="category")

    def __repr__(self) -> str:
        return f"<Category(id={self.id}, name={self.name}, slug={self.slug}, active={self.is_active})>"
