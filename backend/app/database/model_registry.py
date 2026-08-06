"""
This module centralizes all database models to ensure they are discovered by Alembic
for autogenerate support. Every new model file must be imported here.
"""

# Import the base first to ensure metadata is initialized
from app.database.base_model import Base

# Import all models here
from app.users.models import User
from app.auth.models import RefreshToken

__all__ = ["Base"]
