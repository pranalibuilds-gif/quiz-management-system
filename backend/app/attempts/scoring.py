from typing import List, Tuple
from app.attempts.models import Attempt, AttemptQuestion


class AnswerEvaluator:
    """
    Evaluates if a specific question in an attempt was answered correctly.
    """
    @staticmethod
    def evaluate(attempt_q: AttemptQuestion) -> Tuple[bool, bool]:
        """
        Returns (is_correct, is_unanswered)
        """
        if not attempt_q.selected_option_id:
            return False, True

        # Find the selected option in the snapshot
        selected = next((opt for opt in attempt_q.options if opt.option_id == attempt_q.selected_option_id), None)

        if not selected:
            # Should not happen if data integrity is maintained
            return False, True

        return selected.is_correct, False


class ScoreCalculator:
    """
    Calculates raw marks and counts based on evaluations.
    """
    def __init__(self, negative_marking: float):
        self.negative_marking = negative_marking

    def calculate(self, evaluations: List[Tuple[AttemptQuestion, bool, bool]]) -> Tuple[float, int, int, int]:
        """
        Returns (total_score, correct_count, incorrect_count, unanswered_count)
        """
        score = 0.0
        correct = 0
        incorrect = 0
        unanswered = 0

        for attempt_q, is_correct, is_unanswered in evaluations:
            if is_unanswered:
                unanswered += 1
            elif is_correct:
                correct += 1
                score += attempt_q.marks
            else:
                incorrect += 1
                score -= self.negative_marking

        # Floor score at 0 or allow negative? Usually floor at 0 for quizzes.
        score = max(0.0, score)
        return score, correct, incorrect, unanswered


class ResultGenerator:
    """
    Computes final percentages and pass/fail status.
    """
    @staticmethod
    def generate(total_score: float, total_possible: float, passing_percentage: int) -> Tuple[float, bool]:
        """
        Returns (percentage, is_passed)
        """
        if total_possible == 0:
            return 0.0, False

        percentage = (total_score / total_possible) * 100
        is_passed = percentage >= passing_percentage
        return round(percentage, 2), is_passed
