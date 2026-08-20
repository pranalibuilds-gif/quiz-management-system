from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError

from app.core.config import settings
from app.core.logging import setup_logging
from app.shared.exception_handlers import (
    app_exception_handler,
    validation_exception_handler,
    global_exception_handler,
)
from app.shared.exceptions import AppException
from app.api.v1 import health, auth, users
from app.categories import api as categories
from app.quizzes import api as quizzes
from app.questions import api as questions
from app.attempts import api as attempts
from app.analytics import api as analytics
from app.leaderboard import api as leaderboard

# Setup logging
setup_logging()
import logging
logger = logging.getLogger(__name__)

# Log CORS origins for debugging
logger.info(f"BACKEND_CORS_ORIGINS = {settings.BACKEND_CORS_ORIGINS}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

# Set CORS middleware (normalize origins to avoid trailing-slash mismatches)
# For development, allow all origins to avoid CORS issues from the frontend dev server.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register exception handlers
app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, global_exception_handler)

# Include routers
app.include_router(health.router, prefix=settings.API_V1_STR, tags=["Health"])
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(users.router, prefix=f"{settings.API_V1_STR}/users", tags=["Users"])
app.include_router(categories.router, prefix=f"{settings.API_V1_STR}/categories", tags=["Categories"])
app.include_router(quizzes.router, prefix=f"{settings.API_V1_STR}/quizzes", tags=["Quizzes"])
app.include_router(questions.router, prefix=f"{settings.API_V1_STR}/quizzes", tags=["Questions"])
app.include_router(attempts.router, prefix=f"{settings.API_V1_STR}/attempts", tags=["Attempts"])
app.include_router(analytics.router, prefix=f"{settings.API_V1_STR}/analytics", tags=["Analytics"])
app.include_router(leaderboard.router, prefix=f"{settings.API_V1_STR}/leaderboard", tags=["Leaderboard"])


@app.get("/")
async def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME}",
        "version": settings.VERSION,
        "docs": "/docs"
    }
