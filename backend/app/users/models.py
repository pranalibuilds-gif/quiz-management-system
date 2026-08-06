from datetime import datetime
from typing import Optional

from sqlalchemy import String, Boolean, Enum as SAEnum, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base_model import FullBase
from app.shared.enums import UserRole


class User(FullBase):
    """
    User entity representing both Admins and Students.
    Inherits from FullBase: id (UUID), created_at, updated_at, deleted_at, audit fields.
    """
    __tablename__ = "users"

    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    username: Mapped[str] = mapped_column(String(30), unique=True, index=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)

    role: Mapped[UserRole] = mapped_column(
        SAEnum(UserRole),
        default=UserRole.STUDENT,
        nullable=False
    )

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Trackers for security and analytics
    last_login_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    password_changed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    def __repr__(self) -> str:
        return f"<User(username={self.username}, role={self.role})>"
