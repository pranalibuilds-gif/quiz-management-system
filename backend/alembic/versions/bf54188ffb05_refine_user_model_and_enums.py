"""refine_user_model_and_enums

Revision ID: bf54188ffb05
Revises: c4f39c0ea75d
Create Date: 2026-08-07 03:42:24.357870

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'bf54188ffb05'
down_revision: Union[str, None] = 'c4f39c0ea75d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create the new enum type
    op.execute("CREATE TYPE user_role AS ENUM ('ADMIN', 'STUDENT')")

    # Update the column to use the new type
    op.execute("ALTER TABLE users ALTER COLUMN role TYPE user_role USING role::text::user_role")

    # Drop the old enum type
    op.execute("DROP TYPE userrole")


def downgrade() -> None:
    # Create the old enum type
    op.execute("CREATE TYPE userrole AS ENUM ('ADMIN', 'STUDENT')")

    # Update the column to use the old type
    op.execute("ALTER TABLE users ALTER COLUMN role TYPE userrole USING role::text::userrole")

    # Drop the new enum type
    op.execute("DROP TYPE user_role")
