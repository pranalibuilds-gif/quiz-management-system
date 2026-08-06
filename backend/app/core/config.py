import os
from pathlib import Path
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

# Project Root (backend/)
BASE_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    """
    Global application settings managed via environment variables.
    """
    PROJECT_NAME: str = "Quiz Management System"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # POSTGRES
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: SecretStr = SecretStr("postgres")
    POSTGRES_DB: str = "quiz_db"
    POSTGRES_PORT: int = 5432
    DATABASE_URL: Union[str, None] = None
    DB_ECHO: bool = False

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: Union[str, None], info) -> str:
        """Dynamically builds the connection string if not provided explicitly."""
        if isinstance(v, str) and v:
            return v

        # Accessing secret values requires .get_secret_value()
        password = info.data.get('POSTGRES_PASSWORD').get_secret_value() if hasattr(info.data.get('POSTGRES_PASSWORD'), 'get_secret_value') else info.data.get('POSTGRES_PASSWORD')

        return (
            f"postgresql+asyncpg://{info.data['POSTGRES_USER']}:{password}@"
            f"{info.data['POSTGRES_SERVER']}:{info.data['POSTGRES_PORT']}/{info.data['POSTGRES_DB']}"
        )

    # SECURITY
    # In production, these MUST be set via environment variables.
    # We omit a default for SECRET_KEY to force manual configuration in .env
    SECRET_KEY: SecretStr
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = []

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        """Allows CORS origins to be passed as a comma-separated string in .env"""
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    # UPLOADS
    UPLOAD_DIR: str = "uploads"
    # Derive directories from project root (BASE_DIR)
    @property
    def UPLOAD_PATH(self) -> Path:
        return BASE_DIR / self.UPLOAD_DIR

    @property
    def QUIZ_THUMBNAIL_PATH(self) -> Path:
        return self.UPLOAD_PATH / "quiz-thumbnails"

    model_config = SettingsConfigDict(
        case_sensitive=True,
        env_file=".env",
        env_file_encoding="utf-8"
    )


# Note: This will raise a ValidationError if SECRET_KEY is not in .env
try:
    settings = Settings()
except Exception as e:
    # During initial local setup, we provide a dummy key if .env is missing
    # to prevent the system from being completely un-runnable until the user acts.
    if "SECRET_KEY" in str(e):
        os.environ["SECRET_KEY"] = "temporary_dev_secret_key_change_it"
        settings = Settings()
    else:
        raise e
