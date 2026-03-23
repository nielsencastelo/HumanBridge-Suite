from typing import Generic, List, Optional, TypeVar

from pydantic import BaseModel


T = TypeVar("T")


class ApiMessage(BaseModel):
    message: str


class ApiListResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int


class ErrorResponse(BaseModel):
    detail: str


class LlmInfo(BaseModel):
    mode: str
    used: bool
    model: Optional[str] = None


class LlmCredentials(BaseModel):
    """
    Per-request LLM credentials forwarded by the client (web or mobile).
    These override the server-side .env configuration.
    """
    provider: str  # openai | groq | together | mistral | deepseek | ollama | lmstudio | custom
    base_url: str
    api_key: str
    model: str

