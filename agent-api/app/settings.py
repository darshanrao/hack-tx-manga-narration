from __future__ import annotations

from functools import lru_cache
from typing import List, Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables or an .env file.

    Default .env location: agent-api/.env
    """

    # API
    API_PREFIX: str = "/api"

    # CORS
    CORS_ALLOW_ORIGINS: List[str] = ["http://localhost:3000"]

    # External services (populate via environment or .env)
    SUPABASE_URL: Optional[str] = None
    SUPABASE_KEY: Optional[str] = None
    ELEVENLABS_API_KEY: Optional[str] = None

    # Google AI Studio (Gemini)
    GOOGLE_API_KEY: Optional[str] = None
    GEMINI_MODEL: Optional[str] = None  # e.g., "gemini-2.5-flash" or "gemini-2.5-pro"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=False)


@lru_cache
def get_settings() -> Settings:
    return Settings()
