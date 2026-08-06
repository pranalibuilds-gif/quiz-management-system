import re
import unicodedata

def slugify(text: str) -> str:
    """
    Simplistic slugify function to convert strings to URL-friendly slugs.
    Example: "Programming Basics 101!" -> "programming-basics-101"
    """
    text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('ascii')
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '-', text).strip('-')
    return text
