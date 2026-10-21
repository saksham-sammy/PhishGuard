"""
PhishGuard – Pydantic Schemas (request / response models)
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, HttpUrl, field_validator


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------

class ScanRequest(BaseModel):
    url: str = Field(..., min_length=4, max_length=2048, description="URL to scan")

    @field_validator("url")
    @classmethod
    def url_not_empty(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("URL must not be empty.")
        return stripped


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------

class ScanResponse(BaseModel):
    request_id: str
    url: str
    predicted_class: str          # "phishing" | "legitimate"
    label: int                    # 1 | 0
    probability: Optional[float]  # phishing score or None
    risk_category: str            # "high" | "medium" | "low"
    features: Dict[str, Any]
    warnings: List[str]
    explanation: str
    disclaimer: str
    scanned_at: datetime


class HealthResponse(BaseModel):
    status: str
    model_ready: bool
    version: str


class MetricsResponse(BaseModel):
    available: bool
    model_name: Optional[str] = None
    dataset_source: Optional[str] = None
    dataset_rows: Optional[int] = None
    train_size: Optional[int] = None
    test_size: Optional[int] = None
    accuracy: Optional[float] = None
    precision: Optional[float] = None
    recall: Optional[float] = None
    f1_score: Optional[float] = None
    confusion_matrix: Optional[List[List[int]]] = None
    class_labels: Optional[List[str]] = None
    feature_importances: Optional[Dict[str, float]] = None
    note: Optional[str] = None


class HistoryEntry(BaseModel):
    id: int
    url_display: str
    predicted_class: str
    risk_category: str
    probability: Optional[float]
    scanned_at: datetime


class HistoryResponse(BaseModel):
    entries: List[HistoryEntry]
    total: int


class DeleteHistoryResponse(BaseModel):
    deleted: int
    message: str


class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
