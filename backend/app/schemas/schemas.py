"""
PhishGuard – Pydantic Schemas (request / response models)
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ScanRequest(BaseModel):
    url: str = Field(..., min_length=4, max_length=2048, description="URL to scan")

    @field_validator("url")
    @classmethod
    def url_not_empty(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("URL must not be empty.")
        return stripped


class FeatureAttributionItem(BaseModel):
    feature: str
    value: float
    benign_baseline: float
    contribution: float
    direction: str


class ScanResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    request_id: str
    url: str
    predicted_class: str          # "phishing" | "legitimate"
    label: int                    # 1 | 0
    probability: Optional[float]  # calibrated phishing probability or None
    risk_category: str            # "high" | "medium" | "low"
    features: Dict[str, Any]
    feature_attributions: Optional[List[FeatureAttributionItem]] = None
    ensemble_breakdown: Optional[Dict[str, float]] = None
    warnings: List[str]
    explanation: str
    disclaimer: str
    scanned_at: datetime


class HealthResponse(BaseModel):
    status: str
    model_ready: bool
    version: str


class MetricsResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    available: bool
    model_name: Optional[str] = None
    dataset_source: Optional[str] = None
    partition_protocol: Optional[str] = None
    dataset_rows: Optional[int] = None
    unique_domains: Optional[int] = None
    train_size: Optional[int] = None
    test_size: Optional[int] = None
    feature_count: Optional[int] = None
    accuracy: Optional[float] = None
    precision: Optional[float] = None
    recall: Optional[float] = None
    f1_score: Optional[float] = None
    roc_auc: Optional[float] = None
    pr_auc: Optional[float] = None
    brier_score: Optional[float] = None
    ece: Optional[float] = None
    fpr: Optional[float] = None
    fnr: Optional[float] = None
    confusion_matrix: Optional[List[List[int]]] = None
    class_labels: Optional[List[str]] = None
    bootstrap_95ci: Optional[Dict[str, List[float]]] = None
    cv_5fold: Optional[Dict[str, Any]] = None
    feature_importances: Optional[Dict[str, float]] = None
    all_models: Optional[Dict[str, Any]] = None
    baseline_comparison: Optional[Dict[str, Any]] = None
    ablation_study: Optional[List[Dict[str, Any]]] = None
    ood_benchmarks: Optional[Dict[str, Any]] = None
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
