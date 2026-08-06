import asyncio
import sys
import os
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

# 1. Add the parent directory to sys.path
# This allows Alembic to find the 'app' module when running from the backend/ directory
# While editable install (pip install -e .) is preferred in production,
# this dynamic approach ensures zero-config execution for this project scope.
sys.path.insert(0, os.path.realpath(os.path.join(os.path.dirname(__file__), "..")))

# 2. Import application settings and our Model Registry
# The registry ensures all models are imported so Alembic can detect changes
from app.core.config import settings
from app.database import model_registry
from app.database.base_model import Base

# This is the Alembic Config object, which provides access to the .ini file.
config = context.config

# 3. Dynamically set the sqlalchemy.url from our Pydantic settings
# This avoids hardcoding credentials in alembic.ini
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# 4. Point Alembic to our metadata for 'autogenerate' support
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.
    Outputting SQL scripts without a direct DB connection.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        compare_server_default=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    """Sync helper to run migrations."""
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
        compare_server_default=True,
    )

    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    """Run migrations in 'online' mode.
    Handles the async connection and hands off to the sync helper.
    """
    configuration = config.get_section(config.config_ini_section)
    if configuration is None:
        raise ValueError("Alembic configuration section not found")

    connectable = async_engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
