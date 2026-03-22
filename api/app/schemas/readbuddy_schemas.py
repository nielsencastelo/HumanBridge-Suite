from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, ConfigDict

from app.schemas.common import LlmInfo


class StudentProfileCreate(BaseModel):
    full_name: str = Field(min_length=2)
    age: Optional[int] = None
    grade_level: Optional[str] = None
    language: str = "pt-BR"
    reading_goal: Optional[str] = None
    notes: Optional[str] = None


class StudentProfileRead(StudentProfileCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


class ReadingSessionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    profile_id: Optional[int]
    expected_text: str
    transcript: str
    duration_seconds: float
    accuracy_score: float
    words_per_minute: float
    reading_level: str
    created_at: datetime


class ReadingMistake(BaseModel):
    kind: str
    expected: Optional[str] = None
    spoken: Optional[str] = None
    position: int


class ReadingExercise(BaseModel):
    title: str
    instruction: str
    target_words: List[str]


class AnalyzeReadingRequest(BaseModel):
    profile_id: Optional[int] = None
    expected_text: str = Field(min_length=20)
    transcript: str = Field(min_length=5)
    duration_seconds: float = Field(gt=0)
    language: str = "pt-BR"
    comprehension_goal: Optional[str] = None


class ReadingAnalysisResponse(BaseModel):
    profile_id: Optional[int] = None
    accuracy_score: float
    words_per_minute: float
    words_expected: int
    words_spoken: int
    reading_level: str
    parent_feedback: str
    student_feedback: str
    next_session_plan: List[str]
    mistakes: List[ReadingMistake]
    exercises: List[ReadingExercise]
    comprehension_questions: List[str]
    llm: LlmInfo
