from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file="../../.env", extra="ignore")

    database_url: str = ""
    port: int = 5000
    ai_base_url: str = "https://api.openai.com/v1"
    ai_api_key: str = ""
    ai_model: str = "gpt-4o-mini"

    @property
    def openai_api_key(self) -> str:
        import os

        return self.ai_api_key or os.getenv("OPENAI_API_KEY", "")


settings = Settings()
