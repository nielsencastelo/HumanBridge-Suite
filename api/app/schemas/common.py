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
