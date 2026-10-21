"""
PhishGuard – API endpoint tests

Run from phishguard/backend/:
    pytest tests/ -v

Note: Prediction tests require the model to be trained first.
      The API gracefully returns 503 when the model is absent.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path
from unittest.mock import patch, MagicMock

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.main import app

client = TestClient(app)


# ---------------------------------------------------------------------------
# Health endpoint
# ---------------------------------------------------------------------------

class TestHealth:
    def test_health_returns_200(self):
        resp = client.get("/api/health")
        assert resp.status_code == 200

    def test_health_schema(self):
        resp = client.get("/api/health")
        data = resp.json()
        assert "status" in data
        assert "model_ready" in data
        assert "version" in data

    def test_health_status_ok(self):
        resp = client.get("/api/health")
        assert resp.json()["status"] == "ok"


# ---------------------------------------------------------------------------
# Scan endpoint – input validation
# ---------------------------------------------------------------------------

class TestScanValidation:
    def test_empty_url_rejected(self):
        resp = client.post("/api/scan", json={"url": ""})
        assert resp.status_code == 422

    def test_missing_url_field_rejected(self):
        resp = client.post("/api/scan", json={})
        assert resp.status_code == 422

    def test_url_too_long(self):
        long_url = "http://example.com/" + "a" * 3000
        resp = client.post("/api/scan", json={"url": long_url})
        # Either 422 (pydantic) or 503 (model not ready) are acceptable
        assert resp.status_code in (422, 503, 200)

    def test_whitespace_only_url(self):
        resp = client.post("/api/scan", json={"url": "   "})
        assert resp.status_code == 422


# ---------------------------------------------------------------------------
# Scan endpoint – with mocked model (avoids dependency on training)
# ---------------------------------------------------------------------------

MOCK_RESULT = {
    "predicted_class": "phishing",
    "label": 1,
    "probability": 0.87,
    "risk_category": "high",
    "features": {"url_length": 45, "https": 0},
    "warnings": ["URL uses HTTP (not HTTPS)."],
    "explanation": "The model classified this URL as potentially phishing.",
    "disclaimer": "This result is produced by a machine-learning model.",
}


class TestScanWithMockedModel:
    @patch("app.api.routes.get_model")
    def test_scan_returns_200(self, mock_get_model):
        mock_model = MagicMock()
        mock_model.is_ready = True
        mock_model.predict.return_value = MOCK_RESULT
        mock_get_model.return_value = mock_model

        resp = client.post("/api/scan", json={"url": "http://phishing-example.com"})
        assert resp.status_code == 200

    @patch("app.api.routes.get_model")
    def test_scan_response_schema(self, mock_get_model):
        mock_model = MagicMock()
        mock_model.is_ready = True
        mock_model.predict.return_value = MOCK_RESULT
        mock_get_model.return_value = mock_model

        resp = client.post("/api/scan", json={"url": "http://phishing-example.com"})
        data = resp.json()
        for field in ("request_id", "url", "predicted_class", "risk_category", "disclaimer"):
            assert field in data, f"Missing field: {field}"

    @patch("app.api.routes.get_model")
    def test_scan_legitimate_url(self, mock_get_model):
        legit_result = {**MOCK_RESULT, "predicted_class": "legitimate", "label": 0,
                        "probability": 0.12, "risk_category": "low"}
        mock_model = MagicMock()
        mock_model.is_ready = True
        mock_model.predict.return_value = legit_result
        mock_get_model.return_value = mock_model

        resp = client.post("/api/scan", json={"url": "https://www.google.com"})
        assert resp.json()["predicted_class"] == "legitimate"


# ---------------------------------------------------------------------------
# Scan endpoint – model not ready
# ---------------------------------------------------------------------------

class TestScanModelNotReady:
    @patch("app.api.routes.get_model")
    def test_503_when_model_missing(self, mock_get_model):
        from app.ml.model_service import ModelNotReadyError
        mock_model = MagicMock()
        mock_model.is_ready = False
        mock_model.predict.side_effect = ModelNotReadyError("Model not found.")
        mock_get_model.return_value = mock_model

        resp = client.post("/api/scan", json={"url": "http://example.com"})
        assert resp.status_code == 503


# ---------------------------------------------------------------------------
# Model metrics endpoint
# ---------------------------------------------------------------------------

class TestModelMetrics:
    def test_metrics_returns_200(self):
        resp = client.get("/api/model/metrics")
        assert resp.status_code == 200

    def test_metrics_available_field(self):
        data = client.get("/api/model/metrics").json()
        assert "available" in data

    def test_metrics_unavailable_has_note(self, tmp_path):
        # When no metrics file exists, should return available=False with note
        resp = client.get("/api/model/metrics")
        data = resp.json()
        if not data["available"]:
            assert data.get("note") is not None


# ---------------------------------------------------------------------------
# History endpoints
# ---------------------------------------------------------------------------

class TestHistory:
    def test_history_returns_200_or_404(self):
        resp = client.get("/api/history")
        assert resp.status_code in (200, 404)

    def test_history_schema_when_enabled(self):
        resp = client.get("/api/history")
        if resp.status_code == 200:
            data = resp.json()
            assert "entries" in data
            assert "total" in data

    def test_delete_history(self):
        resp = client.delete("/api/history")
        assert resp.status_code in (200, 404)
