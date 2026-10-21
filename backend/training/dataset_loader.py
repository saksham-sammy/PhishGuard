"""
PhishGuard – Dataset Loader

Downloads and prepares the PhiUSIIL Phishing URL Dataset from the UCI ML Repository.

Dataset:
  Name    : PhiUSIIL Phishing URL Dataset
  Source  : https://archive.ics.uci.edu/dataset/967/phiusiil+phishing+url+dataset
  Licence : Creative Commons Attribution 4.0 International (CC BY 4.0)
  Rows    : ~235 000 labelled URLs (legitimate + phishing)
  Labels  : 'label' column – 1 = phishing, 0 = legitimate

The dataset contains precomputed URL and webpage features.
We use a subset of URL-string-derivable features to keep the inference
pipeline consistent (no webpage fetching at inference time).

Usage:
    python training/dataset_loader.py
"""
from __future__ import annotations

import os
import sys
import zipfile
from pathlib import Path

import pandas as pd
import requests

DATASET_URL = (
    "https://archive.ics.uci.edu/static/public/967/phiusiil+phishing+url+dataset.zip"
)
DATA_DIR = Path(__file__).parent.parent / "data"
ZIP_PATH = DATA_DIR / "phiusiil.zip"
CSV_FILENAME = "PhiUSIIL_Phishing_URL_Dataset.csv"
CSV_PATH = DATA_DIR / CSV_FILENAME


def download_dataset() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    if CSV_PATH.exists():
        print(f"[dataset] Dataset already present at {CSV_PATH}")
        return

    print(f"[dataset] Downloading dataset from UCI ML Repository …")
    print(f"[dataset] URL: {DATASET_URL}")

    try:
        response = requests.get(DATASET_URL, stream=True, timeout=120)
        response.raise_for_status()
    except requests.RequestException as exc:
        print(f"\n[ERROR] Download failed: {exc}")
        print(
            "\nPlease download the dataset manually:\n"
            "  1. Go to: https://archive.ics.uci.edu/dataset/967/phiusiil+phishing+url+dataset\n"
            "  2. Download the ZIP file\n"
            f"  3. Extract '{CSV_FILENAME}' to: {DATA_DIR}\n"
        )
        sys.exit(1)

    total = int(response.headers.get("content-length", 0))
    downloaded = 0
    chunk_size = 65536

    with open(ZIP_PATH, "wb") as f:
        for chunk in response.iter_content(chunk_size=chunk_size):
            if chunk:
                f.write(chunk)
                downloaded += len(chunk)
                if total:
                    pct = downloaded / total * 100
                    print(f"\r  {pct:5.1f}%  ({downloaded // 1024} KB)", end="", flush=True)
    print("\n[dataset] Download complete.")

    # Extract
    print("[dataset] Extracting …")
    with zipfile.ZipFile(ZIP_PATH, "r") as zf:
        # Find the CSV inside the archive (name may vary)
        csv_members = [m for m in zf.namelist() if m.endswith(".csv")]
        if not csv_members:
            print("[ERROR] No CSV file found in the ZIP archive.")
            sys.exit(1)
        member = csv_members[0]
        print(f"[dataset] Extracting '{member}' …")
        zf.extract(member, DATA_DIR)
        extracted = DATA_DIR / member
        if extracted != CSV_PATH:
            extracted.rename(CSV_PATH)

    ZIP_PATH.unlink(missing_ok=True)
    print(f"[dataset] Dataset ready at {CSV_PATH}")


def load_dataset() -> pd.DataFrame:
    """Load and perform initial cleaning of the dataset."""
    if not CSV_PATH.exists():
        print("[dataset] CSV not found – running download …")
        download_dataset()

    print(f"[dataset] Loading {CSV_PATH} …")
    df = pd.read_csv(CSV_PATH, low_memory=False)
    print(f"[dataset] Raw shape: {df.shape}")

    # -----------------------------------------------------------------------
    # Identify label column
    # -----------------------------------------------------------------------
    label_candidates = [c for c in df.columns if c.lower() in ("label", "class", "phishing")]
    if not label_candidates:
        print(f"[ERROR] Cannot find label column. Columns: {list(df.columns)}")
        sys.exit(1)
    label_col = label_candidates[0]
    print(f"[dataset] Label column: '{label_col}'")

    # Normalise label to 0/1
    unique_vals = df[label_col].unique()
    print(f"[dataset] Unique label values: {unique_vals}")

    if set(unique_vals).issubset({0, 1, -1}):
        if -1 in unique_vals:
            # Some UCI datasets use -1 for phishing; convert to 1
            df[label_col] = df[label_col].replace(-1, 1)
    else:
        # Try string mapping
        lower_map = {str(v).lower(): v for v in unique_vals}
        if "phishing" in lower_map or "1" in lower_map:
            df[label_col] = df[label_col].astype(str).str.lower().map(
                lambda x: 1 if x in ("phishing", "1", "yes") else 0
            )

    df = df.rename(columns={label_col: "label"})

    # -----------------------------------------------------------------------
    # Identify URL column (if present)
    # -----------------------------------------------------------------------
    url_candidates = [c for c in df.columns if c.lower() in ("url", "urls", "address")]
    url_col = url_candidates[0] if url_candidates else None
    if url_col:
        print(f"[dataset] URL column: '{url_col}'")
        df = df.rename(columns={url_col: "url"})
    else:
        print("[dataset] No raw URL column found – using precomputed features only.")

    # -----------------------------------------------------------------------
    # Basic cleaning
    # -----------------------------------------------------------------------
    before = len(df)
    df = df.drop_duplicates()
    df = df.dropna(subset=["label"])
    df["label"] = df["label"].astype(int)
    after = len(df)
    print(f"[dataset] After cleaning: {after} rows (removed {before - after})")

    # Class balance
    counts = df["label"].value_counts().to_dict()
    print(f"[dataset] Class distribution: {counts}")

    return df


if __name__ == "__main__":
    download_dataset()
