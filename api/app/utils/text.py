import re
import unicodedata
from typing import List


def strip_accents(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    return "".join(ch for ch in normalized if not unicodedata.combining(ch))


def normalize_text(value: str) -> str:
    value = strip_accents(value or "").lower()
    value = re.sub(r"[\r\n\t]+", " ", value)
    value = re.sub(r"[^a-z0-9à-ÿ/:\-\s]", " ", value, flags=re.IGNORECASE)
    value = re.sub(r"\s+", " ", value).strip()
    return value


def tokenize(value: str) -> List[str]:
    normalized = normalize_text(value)
    return [token for token in normalized.split(" ") if token]


def first_sentence(text: str, fallback: str = "") -> str:
    chunks = re.split(r"(?<=[.!?])\s+", text.strip())
    return chunks[0].strip() if chunks and chunks[0].strip() else fallback
