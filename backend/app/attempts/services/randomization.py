import random
from typing import List, TypeVar

T = TypeVar("T")


class RandomizationService:
    """
    Handles shuffling of questions and options using a deterministic seed.
    """

    @staticmethod
    def shuffle_list(items: List[T], seed: str) -> List[T]:
        """Returns a new shuffled list based on the provided seed."""
        shuffled = list(items)
        random.Random(seed).shuffle(shuffled)
        return shuffled

    @staticmethod
    def generate_seed() -> str:
        """Generates a random hex string to be used as a seed."""
        import uuid
        return uuid.uuid4().hex[:12]
