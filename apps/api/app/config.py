from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file="../../.env", extra="ignore")

    database_url: str = ""
    port: int = 5000
    ai_base_url: str = "https://api.cerebras.ai/v1"
    ai_api_key: str = ""
    ai_model: str = "gpt-oss-120b"
    # Token-saving limits (raise if quiz/polish quality drops)
    ai_quiz_article_chars: int = 3000
    ai_quiz_default_count: int = 5
    ai_quiz_max_output_tokens: int = 2048
    ai_polish_chunk_chars: int = 10000
    ai_polish_max_output_tokens: int = 2048

    @property
    def resolved_ai_api_key(self) -> str:
        import os

        return self.ai_api_key or os.getenv("CEREBRAS_API_KEY", "") or os.getenv("OPENAI_API_KEY", "")


settings = Settings()
