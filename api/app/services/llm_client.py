from __future__ import annotations

from typing import Optional

import httpx

from app.core.config import settings


class OptionalLlmClient:
    """
    LLM client that supports both server-configured credentials (from .env)
    and per-request credentials forwarded from the client application.
    """

    def __init__(
        self,
        *,
        override_base_url: Optional[str] = None,
        override_api_key: Optional[str] = None,
        override_model: Optional[str] = None,
    ) -> None:
        # Per-request overrides take priority over server defaults
        self._base_url = override_base_url or settings.llm_base_url
        self._api_key = override_api_key or settings.llm_api_key
        self._model = override_model or settings.llm_model

        # Enable if server mode is on OR if client provided credentials
        self.enabled = (
            settings.llm_mode.lower() == "openai_compatible"
            or bool(override_base_url and override_api_key)
        )

    def info(self, used: bool = False) -> dict:
        return {
            "mode": "client_credentials" if (self._api_key and self._base_url) else settings.llm_mode,
            "used": used,
            "model": self._model if self.enabled else None,
        }

    async def rewrite(self, system_prompt: str, user_prompt: str) -> Optional[str]:
        if not self.enabled:
            return None

        payload = {
            "model": self._model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.2,
        }
        headers = {"Content-Type": "application/json"}
        if self._api_key:
            headers["Authorization"] = f"Bearer {self._api_key}"

        async with httpx.AsyncClient(timeout=settings.llm_timeout_seconds) as client:
            response = await client.post(
                f"{self._base_url.rstrip('/')}/chat/completions",
                json=payload,
                headers=headers,
            )
            response.raise_for_status()
            data = response.json()

        choices = data.get("choices", [])
        if not choices:
            return None

        return choices[0].get("message", {}).get("content")

