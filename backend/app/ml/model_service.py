"""
PhishGuard – Model Service

Loads the trained model artifact once at startup and exposes a predict()
method used by the API routes.  Model loading is separated from routing.
"""
from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Optional, Dict, Any

import joblib
import numpy as np

from app.ml.feature_extractor import FEATURE_COLUMNS, features_to_row, extract_features, is_trusted_authority

logger = logging.getLogger(__name__)

# Risk thresholds (based on model probability output)
RISK_HIGH = 0.75
RISK_MEDIUM = 0.45


class ModelNotReadyError(RuntimeError):
    """Raised when a prediction is attempted but the model is not loaded."""


class PhishGuardModel:
    """Wrapper around the trained scikit-learn pipeline."""

    def __init__(self, model_path: Path) -> None:
        self._path = model_path
        self._pipeline = None
        self._meta: Dict[str, Any] = {}
        self._load()

    def _load(self) -> None:
        if not self._path.exists():
            logger.warning("Model artifact not found at %s", self._path)
            return
        try:
            artifact = joblib.load(self._path)
            self._pipeline = artifact["pipeline"]
            self._meta = artifact.get("meta", {})
            logger.info("Model loaded from %s", self._path)
        except Exception as exc:
            logger.error("Failed to load model: %s", exc)

    @property
    def is_ready(self) -> bool:
        return self._pipeline is not None

    def predict(self, url: str) -> Dict[str, Any]:
        """
        Predict whether *url* is phishing or legitimate.

        Returns a structured dict; never raises on model errors (returns an
        error key instead so the API can surface a clear message).
        """
        if not self.is_ready:
            raise ModelNotReadyError(
                "Model artifact not found. Run `python training/train_model.py` first."
            )

        features = extract_features(url)

        # Domain reputation check (prevents false alarms on verified global domains like Google search)
        from urllib.parse import urlparse
        parse_target = "http://" + url if "://" not in url else url
        try:
            parsed = urlparse(parse_target)
            host = (parsed.hostname or parsed.netloc or "").lower()
        except Exception:
            host = ""

        is_trusted, root_name = is_trusted_authority(host)
        if is_trusted and not features.get("ip_host") and not features.get("at_symbol"):
            return {
                "predicted_class": "legitimate",
                "label": 0,
                "probability": 0.0,
                "risk_category": "low",
                "features": features,
                "warnings": [],
                "explanation": f"Verified authentic domain authority ({root_name}). Standard search queries, navigation, and API parameters are safe.",
                "disclaimer": (
                    "This result is produced by a machine-learning model trained on a "
                    "labelled dataset. It is a screening tool and NOT a guarantee that "
                    "the URL is safe or malicious. Always exercise caution with unknown URLs."
                ),
            }

        row = features_to_row(url)
        import pandas as pd
        X = pd.DataFrame([row], columns=FEATURE_COLUMNS)

        proba = None
        try:
            proba_arr = self._pipeline.predict_proba(X)
            # Column 1 = phishing probability (label 1)
            proba = float(proba_arr[0][1])
        except AttributeError:
            pass  # model doesn't support predict_proba

        if proba is not None:
            label = 1 if proba >= 0.5 else 0
        else:
            label = int(self._pipeline.predict(X)[0])
            proba = None  # unknown

        predicted_class = "phishing" if label == 1 else "legitimate"

        # Derive risk category
        if proba is not None:
            if proba >= RISK_HIGH:
                risk = "high"
            elif proba >= RISK_MEDIUM:
                risk = "medium"
            else:
                risk = "low"
        else:
            risk = "high" if label == 1 else "low"

        # Human-readable warning indicators
        features = extract_features(url)
        warnings = _build_warnings(features, url)

        # Short explanation (rule-based, not causal)
        explanation = _build_explanation(predicted_class, features, proba)

        return {
            "predicted_class": predicted_class,
            "label": label,
            "probability": round(proba, 4) if proba is not None else None,
            "risk_category": risk,
            "features": features,
            "warnings": warnings,
            "explanation": explanation,
            "disclaimer": (
                "This result is produced by a machine-learning model trained on a "
                "labelled dataset. It is a screening tool and NOT a guarantee that "
                "the URL is safe or malicious. Always exercise caution with unknown URLs."
            ),
        }

    def get_meta(self) -> Dict[str, Any]:
        return self._meta


def _build_warnings(features: Dict[str, Any], url: str) -> list[str]:
    warnings = []
    if features.get("ip_host"):
        warnings.append("Hostname is a raw IP address, which is unusual for legitimate sites.")
    if features.get("at_symbol"):
        warnings.append("URL contains '@' — the browser may ignore everything before it.")
    if features.get("is_shortener"):
        warnings.append("URL uses a known shortening service, hiding the real destination.")
    if features.get("double_slash_redirect"):
        warnings.append("URL contains '//' in the path, which may indicate a redirect trick.")
    if features.get("suspicious_keyword_count", 0) >= 2:
        warnings.append("URL contains multiple phishing-associated keywords.")
    if features.get("hyphen_count", 0) >= 3:
        warnings.append("Hostname has many hyphens, a common pattern in phishing domains.")
    if features.get("dot_count", 0) >= 4:
        warnings.append("Hostname has many dots, suggesting deep subdomain nesting.")
    if features.get("url_length", 0) > 180 and features.get("suspicious_keyword_count", 0) >= 1:
        warnings.append("URL is unusually long with suspicious keyword patterns.")
    if not features.get("https"):
        warnings.append("URL uses HTTP (not HTTPS); data is not encrypted in transit.")
    return warnings


def _build_explanation(cls: str, features: Dict[str, Any], proba: Optional[float]) -> str:
    parts = []
    if cls == "phishing":
        parts.append(
            "The model classified this URL as potentially phishing based on structural "
            "and lexical features of the URL string."
        )
    else:
        parts.append(
            "The model classified this URL as potentially legitimate based on its "
            "structural and lexical features."
        )
    if proba is not None:
        parts.append(
            f"The model assigned a phishing score of {proba:.2%}. "
            "This score reflects the model's learned patterns and is not a "
            "calibrated real-world probability."
        )
    return " ".join(parts)


# Singleton — loaded once per process
_model_instance: Optional[PhishGuardModel] = None


def get_model(model_path: Path) -> PhishGuardModel:
    global _model_instance
    if _model_instance is None:
        _model_instance = PhishGuardModel(model_path)
    return _model_instance
