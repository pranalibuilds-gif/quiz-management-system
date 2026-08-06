import os
import uuid
import shutil
from typing import Sequence, Optional
from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.quizzes.models import Quiz
from app.quizzes.repository import QuizRepository
from app.quizzes.schemas import QuizCreate, QuizUpdate
from app.shared.exceptions import AppException, NotFoundException
from app.shared.enums import QuizStatus
from app.core.config import settings


class QuizService:
    """
    Service layer for Quiz business logic.
    """
    def __init__(self, session: AsyncSession):
        self.repository = QuizRepository(session)
        self.session = session

    async def create_quiz(self, quiz_in: QuizCreate) -> Quiz:
        """Create a new quiz in DRAFT status."""
        quiz = Quiz(**quiz_in.model_dump())
        quiz.status = QuizStatus.DRAFT
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
        skip: int = 0,
        limit: int = 100
    ) -> Sequence[Quiz]:
        """List quizzes with filtering."""
        if published_only:
            return await self.repository.list_published(category_id, skip, limit)
        return await self.repository.list_all(skip, limit)

    async def update_quiz(self, quiz_id: uuid.UUID, quiz_in: QuizUpdate) -> Quiz:
        """Update quiz configuration."""
        quiz = await self.get_quiz(quiz_id)
        update_data = quiz_in.model_dump(exclude_unset=True)
        return await self.repository.update(quiz_id, **update_data)

    async def update_status(self, quiz_id: uuid.UUID, status: QuizStatus) -> Quiz:
        """Change the lifecycle status of a quiz."""
        quiz = await self.get_quiz(quiz_id)
        if quiz.status == QuizStatus.ARCHIVED and status != QuizStatus.ARCHIVED:
             raise AppException("Cannot restore an archived quiz directly", status_code=400)

        return await self.repository.update(quiz_id, status=status)

    async def upload_thumbnail(self, quiz_id: uuid.UUID, file: UploadFile) -> Quiz:
        """Save a thumbnail file and link it to the quiz."""
        quiz = await self.get_quiz(quiz_id)

        # 1. Validate file type
        if not file.content_type.startswith("image/"):
            raise AppException("File must be an image", status_code=400)

        # 2. Prepare directory
        os.makedirs(settings.QUIZ_THUMBNAIL_PATH, exist_ok=True)

        # 3. Generate unique filename
        ext = os.path.splitext(file.filename)[1]
        filename = f"{quiz_id}{ext}"
        file_path = os.path.join(settings.QUIZ_THUMBNAIL_PATH, filename)

        # 4. Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 5. Update DB (store relative path)
        relative_path = os.path.join(settings.QUIZ_THUMBNAIL_DIR, filename)
        return await self.repository.update(quiz_id, thumbnail_path=relative_path)

    async def delete_quiz(self, quiz_id: uuid.UUID) -> bool:
        """Soft delete a quiz."""
        await self.get_quiz(quiz_id)
        return await self.repository.soft_delete(quiz_id)
