from typing import List
from app.shared.exceptions import AppException


class QuestionValidator:
    """
    Centralized validation logic for Questions and Options.
    """

    @staticmethod
    def validate_options(options: List[dict]):
        """
        Validates that a question has exactly one correct answer and unique options.
        """
        if len(options) < 2:
            raise AppException("A question must have at least 2 options", status_code=400)

        correct_count = sum(1 for opt in options if opt.get("is_correct", False))
        if correct_count == 0:
            raise AppException("A question must have exactly one correct option", status_code=400)
        if correct_count > 1:
            raise AppException("A question cannot have more than one correct option in v1", status_code=400)

        # Check for duplicate option text
        texts = [opt.get("text", "").strip().lower() for opt in options]
        if len(texts) != len(set(texts)):
            raise AppException("Duplicate option text found for this question", status_code=400)

    @staticmethod
    def validate_marks(marks: float):
        if marks <= 0:
            raise AppException("Marks must be a positive number", status_code=400)
