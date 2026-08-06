from datetime import datetime, timezone, timedelta
from app.attempts.models import Attempt
from app.shared.enums import AttemptStatus


class ReviewPolicy:
    """
    Centralizes the logic for when an attempt can be reviewed.
    """

    REVIEW_DELAY_HOURS = 24

    @staticmethod
    def can_review_answers(attempt: Attempt) -> bool:
        """
        Determines if the detailed answers/explanations can be shown.
        Rules:
        1. Attempt must be submitted (SUBMITTED or AUTO_SUBMITTED).
        2. At least 24 hours must have passed since submission.
        """
        if attempt.status not in {AttemptStatus.SUBMITTED, AttemptStatus.AUTO_SUBMITTED}:
            return False

        if not attempt.submitted_at:
            return False

        ready_at = attempt.submitted_at + timedelta(hours=ReviewPolicy.REVIEW_DELAY_HOURS)
        return datetime.now(timezone.utc) >= ready_at

    @staticmethod
    def get_review_availability_time(attempt: Attempt) -> datetime:
        """Returns the timestamp when the review will become available."""
        if not attempt.submitted_at:
            return datetime.now(timezone.utc) + timedelta(hours=ReviewPolicy.REVIEW_DELAY_HOURS)
        return attempt.submitted_at + timedelta(hours=ReviewPolicy.REVIEW_DELAY_HOURS)
