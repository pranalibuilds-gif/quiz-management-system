import asyncio
import os
os.environ["POSTGRES_DB"] = "quiz_db_test"

from app.core.config import settings
from sqlalchemy.ext.asyncio import create_async_engine

async def test():
    print(f"Connecting to: {settings.DATABASE_URL}")
    engine = create_async_engine(settings.DATABASE_URL)
    async with engine.connect() as conn:
        print("Connected!")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(test())
