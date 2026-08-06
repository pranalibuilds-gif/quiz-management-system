import asyncio
import asyncpg
from app.core.config import settings

async def create_db():
    # Connect to the default 'postgres' database
    conn = await asyncpg.connect(
        user=settings.POSTGRES_USER,
        password=settings.POSTGRES_PASSWORD.get_secret_value(),
        host=settings.POSTGRES_SERVER,
        port=settings.POSTGRES_PORT,
        database='postgres'
    )
    try:
        # Check if database exists
        exists = await conn.fetchval(f"SELECT 1 FROM pg_database WHERE datname = '{settings.POSTGRES_DB}'")
        if not exists:
            # CREATE DATABASE cannot run inside a transaction block
            await conn.execute(f'CREATE DATABASE {settings.POSTGRES_DB}')
            print(f"Database {settings.POSTGRES_DB} created successfully.")
        else:
            print(f"Database {settings.POSTGRES_DB} already exists.")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(create_db())
