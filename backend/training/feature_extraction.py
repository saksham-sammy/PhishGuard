"""
PhishGuard – Feature Extraction for Training

This module maps the dataset's URL strings (when available) to the same
feature set used at inference time.  When only precomputed features exist,
it selects the subset that corresponds to our FEATURE_COLUMNS.

Keep this consistent with backend/app/ml/feature_extractor.py.
"""
from __future__ import annotations

import sys
from pathlib import Path
from typing import Tuple

import pandas as pd
import numpy as np

# Make the app package importable from training/
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.ml.feature_extractor import FEATURE_COLUMNS, features_to_row

# ---------------------------------------------------------------------------
# Mapping: UCI PhiUSIIL column names → our feature names where possible
# These are approximate mappings; only used when no raw URL column exists.
# ---------------------------------------------------------------------------
PHIUSIIL_COLUMN_MAP = {
    "URLLength":            "url_length",
    "DomainLength":         "hostname_length",
    "NoOfDots":             "dot_count",
    "NoOfHyphen":           "hyphen_count",
    "NoOfUnderLine":        "underscore_count",
    "NoOfSlash":            "slash_count",
    "NoOfQMark":            "question_mark_count",
    "NoOfEqual":            "equal_count",
    "NoOfAmpersand":        "ampersand_count",
    "IsHTTPS":              "https",
    "NoOfOtherSpecialChars":"special_char_count",
    "NoOfNumericChars":     "digit_count",
    "HasObfuscation":       "double_slash_redirect",
}


def build_feature_matrix(df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series]:
    """
    Build the (X, y) feature matrix from the dataset dataframe.

    Strategy:
    1. If a 'url' column exists, extract features from each URL string.
    2. Otherwise map available precomputed columns to our feature set,
       filling zeros for unavailable features.

    Returns
    -------
    X : pd.DataFrame  – shape (n, len(FEATURE_COLUMNS))
    y : pd.Series     – label (0 / 1)
    """
    y = df["label"].astype(int)

    if "url" in df.columns:
        print("[features] Extracting features from URL strings …")
        rows = []
        total = len(df)
        for i, url in enumerate(df["url"]):
            if i % 10000 == 0:
                print(f"  {i}/{total}", end="\r", flush=True)
            try:
                rows.append(features_to_row(str(url)))
            except Exception:
                rows.append([0.0] * len(FEATURE_COLUMNS))
        print(f"  {total}/{total} – done.          ")
        X = pd.DataFrame(rows, columns=FEATURE_COLUMNS)
    else:
        print("[features] No URL column – mapping precomputed features …")
        X = pd.DataFrame(index=df.index)
        for feat in FEATURE_COLUMNS:
            # Find matching precomputed column
            src = None
            for k, v in PHIUSIIL_COLUMN_MAP.items():
                if v == feat and k in df.columns:
                    src = k
                    break
            if src:
                X[feat] = pd.to_numeric(df[src], errors="coerce").fillna(0)
            else:
                X[feat] = 0
        print(f"[features] Mapped {sum(X.std() > 0)} / {len(FEATURE_COLUMNS)} features with variance.")

    # Ensure correct dtypes
    X = X.astype(float)
    X = X.reset_index(drop=True)
    y = y.reset_index(drop=True)

    print(f"[features] Feature matrix: {X.shape}")
    return X, y
