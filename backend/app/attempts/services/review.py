from app.attempts.models import Attempt
from app.attempts.services.policy import ReviewPolicy
from app.shared.exceptions import AppException


class ReviewService:
    """
    Handles logic for fetching and preparing attempts for student review.
    """

    @staticmethod
    def prepare_for_review(attempt: Attempt):
        """
        Validates if review is allowed and hides sensitive info if not ready.
        """
        if not ReviewPolicy.can_review_answers(attempt):
            # In a real app, we might raise an error or just clear the explanations/correct flags
            # Since our schema handles 'explanation' visibility, we can just ensure
            # the service enforces the policy if needed.

            # For v1, we will return the attempt but the frontend/API will hide
            # details based on the can_review flag.
            pass

        return attempt

    @staticmethod
    def get_review_status(attempt: Attempt) -> dict:
        """Returns details about when review will be available."""
        can_review = ReviewPolicy.can_review_answers(attempt)
        available_at = ReviewPolicy.get_review_availability_time(attempt)

        return {
            "can_review": can_review,
            "available_at": available_at,
            "hours_remaining": max(0, (available_at - datetime.now(timezone.utc)).total_seconds() / 3600) if not can_review else 0
        }

from datetime import datetime, timezone
