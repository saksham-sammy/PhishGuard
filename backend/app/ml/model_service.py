"""
PhishGuard – Model Service

Loads the trained PhishGuard-Stack calibrated heterogeneous ensemble once at
startup and exposes predict() with base-model breakdown and quantitative
instance-level feature attributions.
"""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse

import joblib
import numpy as np

from app.ml.feature_extractor import (
    FEATURE_COLUMNS,
    extract_features,
    features_to_row,
    is_trusted_authority,
)

logger = logging.getLogger(__name__)

# Calibrated probability thresholds for three-band operational triage
RISK_HIGH = 0.75
RISK_MEDIUM = 0.45


class ModelNotReadyError(RuntimeError):
    """Raised when a prediction is attempted before the model artifact exists."""


class PhishGuardModel:
    """Wrapper around the trained PhishGuard-Stack classifier."""

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
        Classify *url* as phishing or legitimate without any network I/O,
        returning calibrated probability, risk band, ensemble sub-scores,
        quantitative feature attributions, and human-readable warnings.
        """
        if not self.is_ready:
            raise ModelNotReadyError(
                "Model artifact not found. Run `python training/train_model.py` first."
            )

        features = extract_features(url)
        row = [float(features[col]) for col in FEATURE_COLUMNS]

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
                "feature_attributions": [],
                "ensemble_breakdown": {
                    "logistic_regression": 0.0,
                    "random_forest": 0.0,
                    "hist_gradient_boosting": 0.0,
                    "epistemic_disagreement": 0.0,
                    "calibrated_stack": 0.0,
                },
                "warnings": [],
                "explanation": (
                    f"Verified registrable domain authority ({root_name}); "
                    "shared multi-tenant hosting suffixes are excluded from allow-listing."
                ),
                "disclaimer": (
                    "This result is produced by a fetch-free statistical URL classifier "
                    "trained on domain-disjoint public benchmarks. Exercise caution with "
                    "links hosted on shared cloud platforms."
                ),
            }

        proba: Optional[float] = None
        ensemble_breakdown: Optional[Dict[str, float]] = None
        feature_attributions: List[Dict[str, Any]] = []

        if hasattr(self._pipeline, "explain_instance"):
            expl = self._pipeline.explain_instance(row, FEATURE_COLUMNS, url=url, top_k=6)
            ensemble_breakdown = expl["ensemble_breakdown"]
            feature_attributions = expl["feature_attributions"]
            proba = float(ensemble_breakdown["calibrated_stack"])
        else:
            X_arr = np.asarray([row], dtype=np.float64)
            try:
                proba_arr = self._pipeline.predict_proba(X_arr)
                proba = float(proba_arr[0][1])
            except AttributeError:
                pass

        if proba is not None:
            label = 1 if proba >= 0.5 else 0
            if proba >= RISK_HIGH:
                risk = "high"
            elif proba >= RISK_MEDIUM:
                risk = "medium"
            else:
                risk = "low"
        else:
            label = int(self._pipeline.predict(np.asarray([row], dtype=np.float64))[0])
            risk = "high" if label == 1 else "low"

        predicted_class = "phishing" if label == 1 else "legitimate"
        warnings = _build_warnings(features)
        explanation = _build_explanation(predicted_class, proba, feature_attributions)

        return {
            "predicted_class": predicted_class,
            "label": label,
            "probability": round(proba, 4) if proba is not None else None,
            "risk_category": risk,
            "features": features,
            "feature_attributions": feature_attributions,
            "ensemble_breakdown": ensemble_breakdown,
            "warnings": warnings,
            "explanation": explanation,
            "disclaimer": (
                "This result is produced by a fetch-free statistical URL classifier "
                "trained on domain-disjoint public benchmarks. Exercise caution with "
                "links hosted on shared cloud platforms."
            ),
        }

    def get_meta(self) -> Dict[str, Any]:
        return self._meta


def _build_warnings(features: Dict[str, Any]) -> list[str]:
    warnings: list[str] = []
    if features.get("ip_host"):
        warnings.append("Hostname is a raw IP literal rather than a registered domain name.")
    if features.get("at_symbol"):
        warnings.append("URL contains '@' userinfo syntax, masking the actual destination host.")
    if features.get("brand_spoof_score", 0.0) >= 0.80:
        warnings.append(
            "Brand-domain spoofing detected: target brand token appears outside an authorized registrable root."
        )
    if features.get("sld_typosquat_score", 0.0) >= 0.78:
        warnings.append(
            "Registrable domain exhibits homoglyph or edit-distance typosquatting proximity to a known brand."
        )
    if features.get("tld_in_subdomain"):
        warnings.append(
            "Embedded top-level domain token inside subdomain or hyphenated label (subdomain cloaking pattern)."
        )
    if features.get("suspicious_tld"):
        warnings.append("Registrable domain uses a high-abuse top-level domain suffix.")
    if features.get("free_hosting_host"):
        warnings.append("Hosted on a multi-tenant free or ephemeral cloud preview domain.")
    if features.get("punycode_idn"):
        warnings.append("Internationalized Punycode (xn--) or non-ASCII domain label detected.")
    if features.get("is_shortener"):
        warnings.append("URL uses a link shortening service that obscures the final destination.")
    if features.get("double_slash_redirect"):
        warnings.append("URL contains extra '//' inside the path, indicating a potential open redirect.")
    if features.get("suspicious_keyword_count", 0) >= 2:
        warnings.append("Multiple credential-harvesting lure keywords appear in the URL.")
    if features.get("hyphen_count", 0) >= 3:
        warnings.append("Hostname contains three or more hyphens, typical of deceptive compound domains.")
    if not features.get("https"):
        warnings.append("Plaintext HTTP scheme; transport layer encryption is absent.")
    return warnings


def _build_explanation(
    cls: str,
    proba: Optional[float],
    attributions: List[Dict[str, Any]],
) -> str:
    verdict = (
        "Classified as phishing by the calibrated multi-view stacking ensemble."
        if cls == "phishing"
        else "Classified as legitimate by the calibrated multi-view stacking ensemble."
    )
    parts = [verdict]
    if proba is not None:
        parts.append(f"Calibrated phishing probability: {proba:.2%}.")
    if attributions:
        top_drivers = ", ".join(
            f"{a['feature']} ({a['contribution']:+.3f})" for a in attributions[:3]
        )
        parts.append(f"Primary local attributions: {top_drivers}.")
    return " ".join(parts)


_model_instance: Optional[PhishGuardModel] = None


def get_model(model_path: Path) -> PhishGuardModel:
    global _model_instance
    if _model_instance is None:
        _model_instance = PhishGuardModel(model_path)
    return _model_instance
