"""
PhishGuard – Model Training Script (no-matplotlib version)

Trains Logistic Regression + Random Forest, picks best by F1, saves:
  models/phishguard_model.joblib
  models/evaluation_metrics.json

Usage (from phishguard/backend/):
    python training/train_model.py
"""
from __future__ import annotations

import json
import sys
import warnings
from pathlib import Path
from time import perf_counter

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score, f1_score, precision_score,
    recall_score, confusion_matrix, classification_report,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.utils.class_weight import compute_class_weight

warnings.filterwarnings("ignore")

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.ml.feature_extractor import FEATURE_COLUMNS, features_to_row

RANDOM_SEED = 42
TEST_SIZE   = 0.20
MODELS_DIR  = Path(__file__).parent.parent / "models"
DATA_DIR    = Path(__file__).parent.parent / "data"
CSV_PATH    = DATA_DIR / "PhiUSIIL_Phishing_URL_Dataset.csv"
MODELS_DIR.mkdir(exist_ok=True)


# ── Dataset ──────────────────────────────────────────────────────────────────

def _load_or_generate() -> pd.DataFrame:
    if CSV_PATH.exists():
        print(f"[train] Loading dataset from {CSV_PATH} …")
        df = pd.read_csv(CSV_PATH)
        # Normalise label column
        label_col = next(
            (c for c in df.columns if c.lower() in ("label", "class", "phishing")), None
        )
        if label_col is None:
            print("[ERROR] No label column found in CSV.")
            sys.exit(1)
        df = df.rename(columns={label_col: "label"})
        df["label"] = pd.to_numeric(df["label"], errors="coerce").fillna(0).astype(int)
        df = df.drop_duplicates().dropna(subset=["label"])
        print(f"[train] Loaded {len(df)} rows. Classes: {df['label'].value_counts().to_dict()}")
        return df
    else:
        print("[train] Dataset not found – generating synthetic dataset …")
        from training.generate_dataset import generate, OUT_PATH
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        df = generate()
        df.to_csv(OUT_PATH, index=False)
        print(f"[train] Synthetic dataset saved → {OUT_PATH}")
        return df


def _build_features(df: pd.DataFrame):
    """Extract URL features; fall back to precomputed columns if no 'url' column."""
    if "url" in df.columns:
        print(f"[train] Extracting features from {len(df)} URL strings …")
        rows = []
        for i, url in enumerate(df["url"]):
            if i % 5000 == 0:
                print(f"  {i}/{len(df)}", end="\r", flush=True)
            try:
                rows.append(features_to_row(str(url)))
            except Exception:
                rows.append([0.0] * len(FEATURE_COLUMNS))
        print(f"  {len(df)}/{len(df)} done.          ")
        X = pd.DataFrame(rows, columns=FEATURE_COLUMNS, dtype=float)
    else:
        # Map precomputed columns
        PHIUSIIL_MAP = {
            "URLLength": "url_length", "DomainLength": "hostname_length",
            "NoOfDots": "dot_count", "NoOfHyphen": "hyphen_count",
            "NoOfUnderLine": "underscore_count", "NoOfSlash": "slash_count",
            "NoOfQMark": "question_mark_count", "NoOfEqual": "equal_count",
            "NoOfAmpersand": "ampersand_count", "IsHTTPS": "https",
            "NoOfOtherSpecialChars": "special_char_count",
            "NoOfNumericChars": "digit_count",
        }
        X = pd.DataFrame(index=df.index)
        for feat in FEATURE_COLUMNS:
            src = next((k for k, v in PHIUSIIL_MAP.items() if v == feat and k in df.columns), None)
            X[feat] = pd.to_numeric(df[src], errors="coerce").fillna(0) if src else 0
        X = X.astype(float)

    y = df["label"].astype(int).reset_index(drop=True)
    X = X.reset_index(drop=True)
    print(f"[train] Feature matrix: {X.shape}")
    return X, y


# ── Training ─────────────────────────────────────────────────────────────────

def _class_weights(y):
    classes = np.unique(y)
    w = compute_class_weight("balanced", classes=classes, y=y)
    return dict(zip(classes.tolist(), w.tolist()))


def _train_lr(X_train, y_train) -> Pipeline:
    return Pipeline([
        ("scaler", StandardScaler()),
        ("clf", LogisticRegression(
            max_iter=1000, class_weight=_class_weights(y_train),
            random_state=RANDOM_SEED, solver="lbfgs",
        )),
    ]).fit(X_train, y_train)


def _train_rf(X_train, y_train) -> Pipeline:
    return Pipeline([
        ("clf", RandomForestClassifier(
            n_estimators=150, max_depth=18, min_samples_leaf=4,
            class_weight=_class_weights(y_train),
            random_state=RANDOM_SEED, n_jobs=-1,
        )),
    ]).fit(X_train, y_train)


def _eval(name, pipe, X_test, y_test) -> dict:
    y_pred = pipe.predict(X_test)
    result = dict(
        name=name,
        acc=accuracy_score(y_test, y_pred),
        prec=precision_score(y_test, y_pred, zero_division=0),
        rec=recall_score(y_test, y_pred, zero_division=0),
        f1=f1_score(y_test, y_pred, zero_division=0),
        cm=confusion_matrix(y_test, y_pred).tolist(),
        pipe=pipe,
    )
    print(f"\n{'─'*50}")
    print(f"  {name}")
    print(f"  Accuracy  : {result['acc']:.4f}")
    print(f"  Precision : {result['prec']:.4f}")
    print(f"  Recall    : {result['rec']:.4f}")
    print(f"  F1-Score  : {result['f1']:.4f}")
    print(classification_report(y_test, y_pred, target_names=["Legitimate", "Phishing"]))
    return result


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    print("\n" + "="*50)
    print("  PhishGuard – Training")
    print("="*50)

    df = _load_or_generate()
    X, y = _build_features(df)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_SEED, stratify=y
    )
    print(f"\n[train] Train={len(X_train)}  Test={len(X_test)}")

    print("\n[train] Logistic Regression …")
    t = perf_counter(); lr = _eval("Logistic Regression", _train_lr(X_train, y_train), X_test, y_test)
    print(f"  time: {perf_counter()-t:.1f}s")

    print("\n[train] Random Forest …")
    t = perf_counter(); rf = _eval("Random Forest", _train_rf(X_train, y_train), X_test, y_test)
    print(f"  time: {perf_counter()-t:.1f}s")

    best = max([lr, rf], key=lambda r: r["f1"])
    print(f"\n[train] Best model: {best['name']} (F1={best['f1']:.4f})")

    # Feature importances (RF only)
    fi_dict: dict = {}
    clf = best["pipe"].named_steps.get("clf")
    if clf and hasattr(clf, "feature_importances_"):
        fi = clf.feature_importances_
        idx = np.argsort(fi)[::-1]
        fi_dict = {FEATURE_COLUMNS[i]: round(float(fi[i]), 6) for i in idx}

    # Save model
    model_path = MODELS_DIR / "phishguard_model.joblib"
    joblib.dump({"pipeline": best["pipe"], "meta": {
        "model_name": best["name"], "feature_columns": FEATURE_COLUMNS,
        "random_seed": RANDOM_SEED,
    }}, model_path)
    print(f"[train] Model → {model_path}")

    # Save metrics JSON
    metrics = {
        "model_name": best["name"],
        "dataset_source": (
            "Synthetic URL dataset generated by PhishGuard "
            "(training/generate_dataset.py) – 30 000 labelled URL strings"
            if not (DATA_DIR / "PhiUSIIL_Phishing_URL_Dataset.csv").exists()
            else "PhiUSIIL Phishing URL Dataset (UCI ML Repository, CC BY 4.0)"
        ),
        "dataset_rows": len(df),
        "train_size": len(X_train),
        "test_size": len(X_test),
        "accuracy":  round(best["acc"], 4),
        "precision": round(best["prec"], 4),
        "recall":    round(best["rec"], 4),
        "f1_score":  round(best["f1"], 4),
        "confusion_matrix": best["cm"],
        "class_labels": ["Legitimate", "Phishing"],
        "feature_importances": fi_dict,
        "all_models": {
            "Logistic Regression": {"accuracy": round(lr["acc"],4), "precision": round(lr["prec"],4),
                                    "recall": round(lr["rec"],4), "f1_score": round(lr["f1"],4)},
            "Random Forest":       {"accuracy": round(rf["acc"],4), "precision": round(rf["prec"],4),
                                    "recall": round(rf["rec"],4), "f1_score": round(rf["f1"],4)},
        },
    }
    metrics_path = MODELS_DIR / "evaluation_metrics.json"
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=2)
    print(f"[train] Metrics → {metrics_path}")

    print("\n" + "="*50)
    print(f"  Done!  F1={best['f1']:.4f}  Acc={best['acc']:.4f}")
    print("="*50 + "\n")


if __name__ == "__main__":
    main()
