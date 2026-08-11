import pytest
from app.attempts.scoring import ScoreCalculator, ResultGenerator

def test_score_calculator():
    calc = ScoreCalculator(negative_marking=0.25)

    # Mock evaluations: (question_obj, is_correct, is_unanswered)
    # Marks for each question = 1.0
    from collections import namedtuple
    Q = namedtuple('Q', ['marks'])

    evals = [
        (Q(1.0), True, False),  # +1
        (Q(1.0), False, False), # -0.25
        (Q(1.0), False, True),  # 0
    ]

    score, correct, incorrect, unanswered = calc.calculate(evals)
    assert score == 0.75
    assert correct == 1
    assert incorrect == 1
    assert unanswered == 1

def test_result_generator():
    res = ResultGenerator.generate(total_score=7.5, total_possible=10.0, passing_percentage=70)
    assert res == (75.0, True)

    res_fail = ResultGenerator.generate(total_score=5.0, total_possible=10.0, passing_percentage=70)
    assert res_fail == (50.0, False)
