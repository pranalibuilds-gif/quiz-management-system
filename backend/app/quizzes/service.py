import os
import uuid
import shutil
from datetime import datetime, timezone
from typing import Sequence, Optional, List
from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.quizzes.models import Quiz
from app.quizzes.repository import QuizRepository
from app.quizzes.schemas import QuizCreate, QuizUpdate
from app.shared.exceptions import AppException, NotFoundException
from app.shared.enums import QuizStatus, DifficultyLevel
from app.core.config import settings, BASE_DIR
from app.shared.utils import slugify
from app.quizzes.validators import QuizValidator


class QuizService:
    """
    Service layer for Quiz business logic.
    Handles lifecycle, versioning, and assets.
    """
    def __init__(self, session: AsyncSession):
        self.repository = QuizRepository(session)
        self.session = session

    async def create_quiz(self, quiz_in: QuizCreate) -> Quiz:
        """Initialize a new quiz in DRAFT status."""
        quiz_data = quiz_in.model_dump()
        quiz_data["slug"] = f"{slugify(quiz_in.title)}-{uuid.uuid4().hex[:6]}"
        quiz_data["status"] = QuizStatus.DRAFT

        quiz = Quiz(**quiz_data)
        return await self.repository.create(quiz)

    async def get_quiz(self, quiz_id: uuid.UUID) -> Quiz:
        """Fetch a quiz or raise 404."""
        quiz = await self.repository.get_by_id(quiz_id)
        if not quiz or quiz.deleted_at:
            raise NotFoundException("Quiz not found")
        return quiz

    async def list_quizzes(
        self,
        published_only: bool = True,
        category_id: Optional[uuid.UUID] = None,
        status: Optional[QuizStatus] = None,
        difficulty: Optional[DifficultyLevel] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Quiz]:
        """List quizzes with filtering."""
        if published_only:
            return await self.repository.list_published(category_id, skip, limit)

        # Admin view: Filter by all available parameters
        from sqlalchemy import select
        query = select(Quiz).where(Quiz.deleted_at == None)

        if category_id:
            query = query.where(Quiz.category_id == category_id)
        if status:
            query = query.where(Quiz.status == status)
        if difficulty:
            query = query.where(Quiz.difficulty == difficulty)

        query = query.offset(skip).limit(limit).order_by(Quiz.created_at.desc())
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def update_quiz(self, quiz_id: uuid.UUID, quiz_in: QuizUpdate) -> Quiz:
        """
        Update quiz configuration.
        Implements versioning: If a quiz is PUBLISHED, a new version is created.
        """
        quiz = await self.get_quiz(quiz_id)
        update_data = quiz_in.model_dump(exclude_unset=True)

        if quiz.status == QuizStatus.PUBLISHED:
            return await self._create_new_version(quiz, update_data)

        if "title" in update_data and update_data["title"] != quiz.title:
             update_data["slug"] = f"{slugify(update_data['title'])}-{uuid.uuid4().hex[:6]}"

        return await self.repository.update(quiz_id, **update_data)

    async def _create_new_version(self, old_quiz: Quiz, update_data: dict) -> Quiz:
        """Internal helper to clone a quiz and increment its version."""
        new_quiz = Quiz(
            title=update_data.get("title", old_quiz.title),
            description=update_data.get("description", old_quiz.description),
            category_id=update_data.get("category_id", old_quiz.category_id),
            version=old_quiz.version + 1,
            status=QuizStatus.DRAFT,
            duration_minutes=update_data.get("duration_minutes", old_quiz.duration_minutes),
            passing_percentage=update_data.get("passing_percentage", old_quiz.passing_percentage),
            maximum_attempts=update_data.get("maximum_attempts", old_quiz.maximum_attempts),
            negative_marking=update_data.get("negative_marking", old_quiz.negative_marking),
            difficulty=update_data.get("difficulty", old_quiz.difficulty),
            randomize_questions=update_data.get("randomize_questions", old_quiz.randomize_questions),
            randomize_options=update_data.get("randomize_options", old_quiz.randomize_options),
            thumbnail_path=old_quiz.thumbnail_path,
            slug=f"{slugify(update_data.get('title', old_quiz.title))}-{uuid.uuid4().hex[:6]}"
        )
        return await self.repository.create(new_quiz)

    async def publish_quiz(self, quiz_id: uuid.UUID) -> Quiz:
        """Business logic for publishing a quiz."""
        from sqlalchemy.orm import selectinload
        from sqlalchemy import select
        from app.questions.models import Question

        query = (
            select(Quiz)
            .where(Quiz.id == quiz_id)
            .options(
                selectinload(Quiz.questions).selectinload(Question.options)
            )
        )
        result = await self.session.execute(query)
        quiz = result.scalar_one_or_none()

        if not quiz or quiz.deleted_at:
            raise NotFoundException("Quiz not found")

        if quiz.status == QuizStatus.PUBLISHED:
            raise AppException("Quiz is already published", status_code=400)
        if quiz.status == QuizStatus.ARCHIVED:
            raise AppException("Cannot publish an archived quiz", status_code=400)

        QuizValidator.validate_for_publish(quiz)

        return await self.repository.update(
            quiz_id,
            status=QuizStatus.PUBLISHED,
            published_at=datetime.now(timezone.utc)
        )

    async def archive_quiz(self, quiz_id: uuid.UUID) -> Quiz:
        """Transition a quiz to ARCHIVED status."""
        quiz = await self.get_quiz(quiz_id)
        return await self.repository.update(
            quiz_id,
            status=QuizStatus.ARCHIVED,
            archived_at=datetime.now(timezone.utc)
        )

    async def update_status(self, quiz_id: uuid.UUID, status: QuizStatus) -> Quiz:
        """Direct status update (Fallback)."""
        return await self.repository.update(quiz_id, status=status)

    async def upload_thumbnail(self, quiz_id: uuid.UUID, file: UploadFile) -> Quiz:
        """Securely handle thumbnail uploads."""
        quiz = await self.get_quiz(quiz_id)

        ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
        if file.content_type not in ALLOWED_TYPES:
            raise AppException("Only JPEG, PNG and WEBP images are allowed", status_code=400)

        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in {".jpg", ".jpeg", ".png", ".webp"}:
             raise AppException("Invalid file extension", status_code=400)

        MAX_SIZE = 2 * 1024 * 1024
        file.file.seek(0, os.SEEK_END)
        size = file.file.tell()
        file.file.seek(0)
        if size > MAX_SIZE:
             raise AppException("Image size exceeds 2MB limit", status_code=400)

        os.makedirs(settings.QUIZ_THUMBNAIL_PATH, exist_ok=True)

        if quiz.thumbnail_path:
             old_path = BASE_DIR / quiz.thumbnail_path
             if old_path.exists():
                 os.remove(old_path)

        filename = f"{quiz_id}{ext}"
        file_path = settings.QUIZ_THUMBNAIL_PATH / filename

        try:
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            relative_path = os.path.relpath(file_path, settings.BASE_DIR)
            return await self.repository.update(quiz_id, thumbnail_path=relative_path)
        except Exception as e:
            if os.path.exists(file_path):
                os.remove(file_path)
            raise AppException(f"Failed to save image: {str(e)}", status_code=500)

    async def delete_quiz(self, quiz_id: uuid.UUID) -> bool:
        """Soft delete a quiz."""
        await self.get_quiz(quiz_id)
        return await self.repository.soft_delete(quiz_id)
