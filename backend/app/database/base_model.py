import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import DateTime, Uuid, MetaData
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, declared_attr

# Define naming conventions for constraints to ensure consistent migration names
# This is a best practice for production databases
convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s"
}


class Base(DeclarativeBase):
    """Base class for all database models"""
    metadata = MetaData(naming_convention=convention)

    def __repr__(self) -> str:
        """Helper representation for debugging"""
        cols = [f"{col}={getattr(self, col)}" for col in self.__table__.columns.keys()]
        return f"<{self.__class__.__name__}({', '.join(cols)})>"


class IDMixin:
    """Mixin to add a UUID primary key to a model"""
    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )


class TimestampMixin:
    """Mixin to add created_at and updated_at timestamps"""
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )


class SoftDeleteMixin:
    """Mixin to add soft delete functionality"""
    deleted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        default=None
    )

    @property
    def is_deleted(self) -> bool:
        return self.deleted_at is not None


class AuditMixin:
    """Mixin to add audit trail (who created/updated the record)"""
    @declared_attr
    def created_by_id(cls) -> Mapped[Optional[uuid.UUID]]:
        return mapped_column(Uuid(as_uuid=True), nullable=True)

    @declared_attr
    def updated_by_id(cls) -> Mapped[Optional[uuid.UUID]]:
        return mapped_column(Uuid(as_uuid=True), nullable=True)


class TimestampedBase(Base, IDMixin, TimestampMixin):
    """Common base class including ID and Timestamps"""
    __abstract__ = True


class FullBase(TimestampedBase, SoftDeleteMixin, AuditMixin):
    """Base class including all common mixins"""
    __abstract__ = True
