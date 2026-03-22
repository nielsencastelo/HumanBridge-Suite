from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "HumanBridge API"
    app_env: str = "development"
    app_debug: bool = True
    api_v1_prefix: str = "/api/v1"
    sqlite_path: str = "./humanbridge.db"
    default_locale: str = "pt-BR"
    cors_origins: str = "http://localhost:3000,http://localhost:19006,http://localhost:8081"

    llm_mode: str = "off"  # off | openai_compatible
    llm_base_url: str = "http://localhost:11434/v1"
    llm_api_key: str = ""
    llm_model: str = "phi4"
    llm_timeout_seconds: int = 60

    max_upload_size_mb: int = 15

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def cors_origins_list(self) -> List[str]:
        return [item.strip() for item in self.cors_origins.split(",") if item.strip()]


settings = Settings()
