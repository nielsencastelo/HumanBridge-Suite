"""
Router: /api/v1/ai-settings

Exposes:
  GET  /providers          → list supported providers and their default base URLs
  POST /validate           → test if user-supplied credentials work (ping the LLM)
"""
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional

from app.core.config import PROVIDER_BASE_URLS
from app.schemas.common import LlmCredentials
from app.services.llm_client import OptionalLlmClient

router = APIRouter()


class ProviderInfo(BaseModel):
    key: str
    label: str
    default_base_url: str
    requires_api_key: bool
    model_placeholder: str


PROVIDER_CATALOG: list[ProviderInfo] = [
    ProviderInfo(key="openai",    label="OpenAI",              default_base_url=PROVIDER_BASE_URLS["openai"],    requires_api_key=True,  model_placeholder="gpt-4o-mini"),
    ProviderInfo(key="anthropic", label="Anthropic (Claude)",  default_base_url=PROVIDER_BASE_URLS["anthropic"], requires_api_key=True,  model_placeholder="claude-3-5-haiku-20241022"),
    ProviderInfo(key="gemini",    label="Google Gemini",       default_base_url=PROVIDER_BASE_URLS["gemini"],    requires_api_key=True,  model_placeholder="gemini-2.0-flash"),
    ProviderInfo(key="groq",      label="Groq",                default_base_url=PROVIDER_BASE_URLS["groq"],      requires_api_key=True,  model_placeholder="llama-3.1-8b-instant"),
    ProviderInfo(key="together",  label="Together AI",         default_base_url=PROVIDER_BASE_URLS["together"],  requires_api_key=True,  model_placeholder="meta-llama/Llama-3-8b-chat-hf"),
    ProviderInfo(key="mistral",   label="Mistral AI",          default_base_url=PROVIDER_BASE_URLS["mistral"],   requires_api_key=True,  model_placeholder="mistral-small-latest"),
    ProviderInfo(key="deepseek",  label="DeepSeek",            default_base_url=PROVIDER_BASE_URLS["deepseek"],  requires_api_key=True,  model_placeholder="deepseek-chat"),
    ProviderInfo(key="ollama",    label="Ollama (local)",      default_base_url=PROVIDER_BASE_URLS["ollama"],    requires_api_key=False, model_placeholder="phi4"),
    ProviderInfo(key="lmstudio",  label="LM Studio (local)",   default_base_url=PROVIDER_BASE_URLS["lmstudio"], requires_api_key=False, model_placeholder="local-model"),
    ProviderInfo(key="custom",    label="Personalizado",       default_base_url="",                              requires_api_key=True,  model_placeholder="nome-do-modelo"),
]


class ValidateRequest(BaseModel):
    credentials: LlmCredentials


class ValidateResponse(BaseModel):
    ok: bool
    message: str
    model_echo: Optional[str] = None


@router.get("/ai-settings/providers", response_model=list[ProviderInfo])
def list_providers() -> list[ProviderInfo]:
    """Return the list of known AI providers so clients can build a picker UI."""
    return PROVIDER_CATALOG


@router.post("/ai-settings/validate", response_model=ValidateResponse)
async def validate_credentials(body: ValidateRequest) -> ValidateResponse:
    """
    Send a minimal prompt to the configured LLM to verify the credentials work.
    Returns ok=True on success, ok=False (with detail) on failure.
    """
    creds = body.credentials
    if not creds.base_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="base_url é obrigatório.",
        )
    if not creds.model:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="model é obrigatório.",
        )

    llm = OptionalLlmClient(
        override_base_url=creds.base_url,
        override_api_key=creds.api_key,
        override_model=creds.model,
    )

    try:
        reply = await llm.rewrite(
            system_prompt="You are a helpful assistant. Reply with exactly one word.",
            user_prompt="Say only: OK",
        )
        return ValidateResponse(
            ok=True,
            message="Conexão estabelecida com sucesso.",
            model_echo=reply.strip() if reply else None,
        )
    except Exception as exc:
        return ValidateResponse(
            ok=False,
            message=f"Falha ao conectar: {exc}",
        )
