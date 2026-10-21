"""
PhishGuard – Application Settings
Reads configuration from environment variables / .env file.
"""
from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path
from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    APP_NAME: str = "PhishGuard"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "*"
    ]

    # Database
    DATABASE_URL: str = "sqlite:///./phishguard.db"
    ENABLE_HISTORY: bool = True

    # Model
    MODEL_PATH: str = "models/phishguard_model.joblib"

    # Limits
    MAX_URL_LENGTH: int = 2048

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors(cls, v):
        if isinstance(v, str):
            import json
            try:
                return json.loads(v)
            except Exception:
                return [origin.strip() for origin in v.split(",")]
        return v

    @property
    def model_file(self) -> Path:
        p = Path(self.MODEL_PATH)
        if p.exists():
            return p
        # Attempt resolution relative to package root
        backend_dir = Path(__file__).resolve().parent.parent.parent
        alt = backend_dir / "models" / "phishguard_model.joblib"
        if alt.exists():
            return alt
        alt2 = Path("backend/models/phishguard_model.joblib")
        if alt2.exists():
            return alt2
        return p


@lru_cache
def get_settings() -> Settings:
    return Settings()
