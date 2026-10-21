# Dataset Information

## PhiUSIIL Phishing URL Dataset

| Field    | Value |
|----------|-------|
| **Source** | [UCI ML Repository – Dataset #967](https://archive.ics.uci.edu/dataset/967/phiusiil+phishing+url+dataset) |
| **Licence** | Creative Commons Attribution 4.0 International (CC BY 4.0) |
| **Rows** | ~235,000 labelled URL records |
| **Labels** | `label`: 0 = Legitimate, 1 = Phishing |
| **Year** | 2023 |

## Features Used

This project extracts **URL-string-only** features to keep inference safe
(no URL fetching at runtime). See `backend/app/ml/feature_extractor.py`
for the full list and definitions.

## Download

Run:
```powershell
cd phishguard\backend
python training\dataset_loader.py
```

Or download manually from the URL above and place
`PhiUSIIL_Phishing_URL_Dataset.csv` in `backend/data/`.

## Limitations

- The model is trained on labelled examples; novel phishing patterns may not be captured.
- URL-only features cannot detect phishing sites that look structurally legitimate.
- Class distribution and collection methodology affect real-world precision.
