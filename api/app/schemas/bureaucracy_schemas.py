from typing import List, Optional

from pydantic import BaseModel, Field

from app.schemas.common import LlmInfo, LlmCredentials


class DeadlineItem(BaseModel):
    raw_text: str
    normalized_date: Optional[str] = None
    confidence: float = 0.0


class ActionItem(BaseModel):
    title: str
    why_it_matters: str
    priority: str = "medium"


class FieldHelpItem(BaseModel):
    field_name: str
    what_to_fill: str
    example_value: Optional[str] = None


class BureaucracyAnalyzeTextRequest(BaseModel):
    title: Optional[str] = None
    raw_text: str = Field(min_length=20)
    locale: str = "pt-BR"
    context_notes: Optional[str] = None
    llm_credentials: Optional[LlmCredentials] = None


class BureaucracyAnalysisResponse(BaseModel):
    detected_document_type: str
    main_topic: str
    plain_language_summary: str
    what_you_need_to_do_now: List[ActionItem]
    deadlines: List[DeadlineItem]
    required_documents: List[str]
    risks_if_ignored: List[str]
    fill_help: List[FieldHelpItem]
    questions_to_ask: List[str]
    important_entities: List[str]
    urgency: str
    confidence: float
    extracted_text: Optional[str] = None
    llm: LlmInfo


class FileAnalysisMetadata(BaseModel):
    filename: str
    content_type: Optional[str] = None
    file_size_bytes: int
    ocr_used: bool = False

