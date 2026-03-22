from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Field, SQLModel


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class StudentProfile(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    full_name: str
    age: Optional[int] = None
    grade_level: Optional[str] = None
    language: str = "pt-BR"
    reading_goal: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=utc_now)


class ReadingSession(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    profile_id: Optional[int] = Field(default=None, foreign_key="studentprofile.id")
    expected_text: str
    transcript: str
    duration_seconds: float
    accuracy_score: float
    words_per_minute: float
    reading_level: str
    created_at: datetime = Field(default_factory=utc_now)
