"""
PhishGuard – API Routes
"""
from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.core.config import get_settings, Settings
from app.ml.model_service import PhishGuardModel, ModelNotReadyError, get_model
from app.schemas.schemas import (
    DeleteHistoryResponse,
    HealthResponse,
    HistoryEntry,
    HistoryResponse,
    MetricsResponse,
    ScanRequest,
    ScanResponse,
)

router = APIRouter()


def _get_model(settings: Settings = Depends(get_settings)) -> PhishGuardModel:
    return get_model(settings.model_file)


# ---------------------------------------------------------------------------
# GET /api/health
# ---------------------------------------------------------------------------

@router.get("/health", response_model=HealthResponse, tags=["System"])
def health(
    settings: Settings = Depends(get_settings),
    model: PhishGuardModel = Depends(_get_model),
):
    return HealthResponse(
        status="ok",
        model_ready=model.is_ready,
        version=settings.APP_VERSION,
    )


# ---------------------------------------------------------------------------
# POST /api/scan
# ---------------------------------------------------------------------------

@router.post(
    "/scan",
    response_model=ScanResponse,
    tags=["Detection"],
    summary="Scan a URL for phishing indicators",
)
def scan_url(
    body: ScanRequest,
    settings: Settings = Depends(get_settings),
    model: PhishGuardModel = Depends(_get_model),
):
    if len(body.url) > settings.MAX_URL_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"URL exceeds maximum length of {settings.MAX_URL_LENGTH} characters.",
        )

    try:
        result = model.predict(body.url)
    except ModelNotReadyError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during prediction. Check server logs.",
        )

    now = datetime.now(timezone.utc)

    # Persist to history if enabled
    if settings.ENABLE_HISTORY:
        try:
            from app.database.db import insert_scan, _truncate_url
            insert_scan(
                url_display=_truncate_url(body.url),
                predicted_class=result["predicted_class"],
                risk_category=result["risk_category"],
                probability=result.get("probability"),
                scanned_at=now,
            )
        except Exception:
            pass  # History failure must not block prediction

    return ScanResponse(
        request_id=str(uuid.uuid4()),
        url=body.url,
        scanned_at=now,
        **{k: v for k, v in result.items()},
    )


# ---------------------------------------------------------------------------
# GET /api/model/metrics
# ---------------------------------------------------------------------------

@router.get("/model/metrics", response_model=MetricsResponse, tags=["Model"])
def model_metrics(settings: Settings = Depends(get_settings)):
    metrics_path = settings.model_file.parent / "evaluation_metrics.json"
    if not metrics_path.exists():
        return MetricsResponse(
            available=False,
            note="Evaluation metrics not found. Run `python training/train_model.py` first.",
        )
    try:
        with open(metrics_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return MetricsResponse(available=True, **data)
    except Exception as exc:
        return MetricsResponse(
            available=False,
            note=f"Failed to load metrics: {exc}",
        )


# ---------------------------------------------------------------------------
# GET /api/history
# ---------------------------------------------------------------------------

@router.get("/history", response_model=HistoryResponse, tags=["History"])
def get_history(settings: Settings = Depends(get_settings)):
    if not settings.ENABLE_HISTORY:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan history is disabled.",
        )
    from app.database.db import get_history
    rows = get_history(limit=200)
    entries = [
        HistoryEntry(
            id=r["id"],
            url_display=r["url_display"],
            predicted_class=r["predicted_class"],
            risk_category=r["risk_category"],
            probability=r.get("probability"),
            scanned_at=datetime.fromisoformat(r["scanned_at"]),
        )
        for r in rows
    ]
    return HistoryResponse(entries=entries, total=len(entries))


# ---------------------------------------------------------------------------
# DELETE /api/history
# ---------------------------------------------------------------------------

@router.delete("/history", response_model=DeleteHistoryResponse, tags=["History"])
def clear_history(settings: Settings = Depends(get_settings)):
    if not settings.ENABLE_HISTORY:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan history is disabled.",
        )
    from app.database.db import delete_all_history
    n = delete_all_history()
    return DeleteHistoryResponse(deleted=n, message=f"Deleted {n} history record(s).")
