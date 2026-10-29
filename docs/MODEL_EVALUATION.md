# PhishGuard-Stack — Model Evaluation Documentation

## 1. Domain-Disjoint Evaluation Methodology

To eliminate the optimistic domain-memorization leakage common in random URL splits, PhishGuard-Stack enforces **registrable-domain-disjoint partitioning**:

1. **Public-Suffix Domain Grouping:** Every URL is mapped to its registrable root domain (`eTLD+1`, handling multi-label suffixes such as `.co.in`, `.ac.uk`, `.com.au`) via `StratifiedGroupKFold`. Zero registrable domains overlap between training and test partitions ($\mathcal{O}_{\text{train}} \cap \mathcal{O}_{\text{test}} = \emptyset$).
2. **Real-World Benchmark Corpora:**
   - **Primary Benchmark:** Hannousse & Yahiouche (2021), *Engineering Applications of Artificial Intelligence* (DOI: `10.17632/c2gw7fy2j4.3`) — **11,429 unique real URLs** (5,715 legitimate + 5,714 phishing across **7,188 unique registrable domains**; Train: 9,143 URLs / 5,752 domains; Test: 2,286 URLs / 1,436 domains).
   - **Cross-Corpus OOD Benchmark:** Sahingoz et al. (2019) Ebbu2017 — **10,000 unseen real URLs** (5,000 legitimate + 5,000 phishing).
   - **Live 2026 Zero-Day Benchmark:** **300 active phishing URLs** from OpenPhish (`53.33%` HTTPS).

---

## 2. Held-Out Domain-Disjoint Test Results ($N = 2,286$)

| Model Architecture | Accuracy | Precision | Recall | F1-Score | ROC-AUC | Brier Score |
|:-------------------|:--------:|:---------:|:------:|:--------:|:-------:|:-----------:|
| Gaussian Naive Bayes (48f) | 0.7423 | 0.9439 | 0.5153 | 0.6667 | 0.8986 | 0.2544 |
| Decision Tree (48f) | 0.8132 | 0.7850 | 0.8626 | 0.8220 | 0.8695 | 0.1453 |
| $k$-Nearest Neighbors (48f) | 0.8285 | 0.8493 | 0.7988 | 0.8233 | 0.9065 | 0.1246 |
| Calibrated Linear SVM (48f) | 0.8469 | 0.8451 | 0.8495 | 0.8473 | 0.9368 | 0.1014 |
| Logistic Regression (48f) | 0.8486 | 0.8486 | 0.8486 | 0.8486 | 0.9362 | 0.1017 |
| MLP Neural Network (48f) | 0.8753 | 0.8540 | 0.9055 | 0.8790 | 0.9574 | 0.0848 |
| Balanced Random Forest (48f) | 0.8832 | 0.8724 | 0.8976 | 0.8849 | 0.9567 | 0.0901 |
| HistGradientBoosting (48f) | 0.8972 | 0.8847 | 0.9134 | 0.8988 | 0.9663 | 0.0725 |
| Tabular Stack (48f LR+RF+HGB) | 0.8950 | 0.8810 | 0.9134 | 0.8969 | 0.9668 | 0.0731 |
| **PhishGuard-Stack (Proposed Dual-Modal)** | **0.9300** | **0.9204** | **0.9414** | **0.9308** | **0.9833** | **0.0494** |

- **5-Fold Domain-Disjoint Cross-Validation:** `0.9269 ± 0.0040` Accuracy, `0.9267 ± 0.0041` F1, `0.9795 ± 0.0044` ROC-AUC.
- **95% Bootstrap Confidence Intervals (1,000 resamples):** Accuracy `[0.9204, 0.9409]`, F1 `[0.9207, 0.9420]`, ROC-AUC `[0.9794, 0.9875]`.
- **Statistical Significance vs. Legacy 24-Feature RF (`0.8718`):** McNemar's $\chi^2_{\text{cc}} = 64.77$, $p < 10^{-15}$.

---

## 3. Confusion Matrix Breakdown ($N = 2,286$)

```
                  Predicted Legitimate    Predicted Phishing
Actual Legitimate         1050                    93
Actual Phishing             67                  1076
```

- **True Negatives (TN = 1,050):** Unseen legitimate domains passed cleanly (`FPR = 8.14%`).
- **False Positives (FP = 93):** Primarily deep multi-segment documentation/academic URLs (`readthedocs.io`, `animaldiversity.org`).
- **False Negatives (FN = 67):** Primarily compromised clean corporate domains or form-builder URLs (`123formbuilder.com`, `FNR = 5.86%`).
- **True Positives (TP = 1,076):** Unseen phishing campaigns accurately detected without network I/O.
