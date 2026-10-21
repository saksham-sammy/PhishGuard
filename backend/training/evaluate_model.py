"""
PhishGuard – Standalone Model Evaluation Script

Re-evaluates the saved model on a fresh test split.
Usage (from phishguard/backend/):
    python training/evaluate_model.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import joblib
import numpy as np
from sklearn.metrics import classification_report, confusion_matrix

sys.path.insert(0, str(Path(__file__).parent.parent))

from training.dataset_loader import load_dataset
from training.feature_extraction import build_feature_matrix
from sklearn.model_selection import train_test_split

RANDOM_SEED = 42
TEST_SIZE = 0.20
MODELS_DIR = Path(__file__).parent.parent / "models"
MODEL_PATH = MODELS_DIR / "phishguard_model.joblib"


def main() -> None:
    if not MODEL_PATH.exists():
        print(f"[eval] Model not found at {MODEL_PATH}. Run train_model.py first.")
        sys.exit(1)

    artifact = joblib.load(MODEL_PATH)
    pipe = artifact["pipeline"]
    meta = artifact.get("meta", {})
    print(f"[eval] Loaded model: {meta.get('model_name', 'unknown')}")

    df = load_dataset()
    X, y = build_feature_matrix(df)
    _, X_test, _, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_SEED, stratify=y
    )

    y_pred = pipe.predict(X_test)
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=["Legitimate", "Phishing"]))
    print("Confusion Matrix:")
    print(confusion_matrix(y_test, y_pred))


if __name__ == "__main__":
    main()
