from app.quizzes.models import Quiz
from app.shared.exceptions import AppException


class QuizValidator:
    """
    Centralized validation logic for Quizzes (Publishing rules, settings).
    """

    @staticmethod
    def validate_for_publish(quiz: Quiz):
        """
        Ensures a quiz meets all criteria to be moved from DRAFT to PUBLISHED.
        """
        if not quiz.title or len(quiz.title) < 3:
            raise AppException("Quiz must have a valid title (min 3 chars)", status_code=400)

        if not quiz.category_id:
            raise AppException("Quiz must be assigned to a category", status_code=400)

        if len(quiz.questions) == 0:
            raise AppException("Cannot publish a quiz with no questions", status_code=400)

        # Every question must have exactly one correct answer
        for q in quiz.questions:
            correct_options = [opt for opt in q.options if opt.is_correct]
            if len(correct_options) != 1:
                raise AppException(f"Question '{q.text[:20]}...' must have exactly one correct answer", status_code=400)

            if len(q.options) < 2:
                 raise AppException(f"Question '{q.text[:20]}...' must have at least 2 options", status_code=400)

    @staticmethod
    def validate_settings(duration: int, attempts: int, passing: int):
        if duration < 1:
            raise AppException("Duration must be at least 1 minute", status_code=400)
        if attempts < 1:
            raise AppException("Maximum attempts must be at least 1", status_code=400)
        if passing < 0 or passing > 100:
            raise AppException("Passing percentage must be between 0 and 100", status_code=400)
