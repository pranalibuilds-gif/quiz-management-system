"""update_attempt_status_enum

Revision ID: 5b06a4b3c19a
Revises: 9c70dfc75a91
Create Date: 2026-08-07 04:10:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5b06a4b3c19a'
down_revision: Union[str, None] = '9c70dfc75a91'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add new values to the enum type
    # Postgres doesn't allow adding values in a transaction before version 12
    # but we are on version 18.
    # Note: COMMIT is usually required for ALTER TYPE ADD VALUE
    op.execute("ALTER TYPE attempt_status ADD VALUE 'CREATED'")
    op.execute("ALTER TYPE attempt_status ADD VALUE 'EXPIRED'")


def downgrade() -> None:
    # Downgrading enums in Postgres is complex (requires recreating the type)
    # Since this is a new project, we can leave it or implement recreation if needed.
    pass
