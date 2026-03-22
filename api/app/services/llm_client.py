from __future__ import annotations

from typing import Optional

import httpx

from app.core.config import settings


class OptionalLlmClient:
    def __init__(self) -> None:
        self.enabled = settings.llm_mode.lower() == "openai_compatible"

    def info(self, used: bool = False) -> dict:
        return {
            "mode": settings.llm_mode,
            "used": used,
            "model": settings.llm_model if self.enabled else None,
        }

    async def rewrite(self, system_prompt: str, user_prompt: str) -> Optional[str]:
        if not self.enabled:
            return None

        payload = {
            "model": settings.llm_model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.2,
        }
        headers = {
            "Content-Type": "application/json",
        }
        if settings.llm_api_key:
            headers["Authorization"] = f"Bearer {settings.llm_api_key}"

        async with httpx.AsyncClient(timeout=settings.llm_timeout_seconds) as client:
            response = await client.post(
                f"{settings.llm_base_url.rstrip('/')}/chat/completions",
                json=payload,
                headers=headers,
            )
            response.raise_for_status()
            data = response.json()

        choices = data.get("choices", [])
        if not choices:
            return None

        return choices[0].get("message", {}).get("content")
