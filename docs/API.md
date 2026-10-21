# PhishGuard — API Specification

The PhishGuard REST API is built on FastAPI and serves predictions, health metrics, and audit logs over standard HTTP.

- **Base URL:** `http://localhost:8000` (or `http://127.0.0.1:8000`)
- **Documentation (Interactive Swagger UI):** `http://localhost:8000/docs`
- **Alternative Redoc Documentation:** `http://localhost:8000/redoc`

---

## 1. System Health & Readiness

### `GET /api/health`
Checks whether the FastAPI application is alive and verifies that the model artifact is loaded into memory.

#### Response `200 OK`
```json
{
  "status": "ok",
  "model_ready": true,
  "version": "1.0.0"
}
```

---

## 2. URL Phishing Screening

### `POST /api/scan`
Extracts lexical features from the provided URL, queries the machine learning pipeline, and returns risk assessments and explainability indicators.

#### Request Body
```json
{
  "url": "http://192.168.1.1/login.php"
}
```

#### Field Constraints
- `url` (string, required): Length between 4 and 2048 characters. Leading/trailing whitespace is trimmed.

#### Response `200 OK`
```json
{
  "request_id": "9e4e972f-5cf2-4bb0-8503-5a9888afef47",
  "url": "http://192.168.1.1/login.php",
  "predicted_class": "phishing",
  "label": 1,
  "probability": 0.9993,
  "risk_category": "high",
  "features": {
    "url_length": 28,
    "hostname_length": 11,
    "path_length": 10,
    "query_length": 0,
    "dot_count": 3,
    "hyphen_count": 0,
    "underscore_count": 0,
    "slash_count": 3,
    "question_mark_count": 0,
    "equal_count": 0,
    "ampersand_count": 0,
    "at_symbol": 0,
    "double_slash_redirect": 0,
    "subdomain_count": 2,
    "digit_count": 8,
    "special_char_count": 1,
    "suspicious_keyword_count": 1,
    "https": 0,
    "ip_host": 1,
    "is_shortener": 0,
    "hostname_entropy": 2.2999,
    "has_port": 0,
    "has_fragment": 0,
    "tld_in_path": 1
  },
  "warnings": [
    "Hostname is a raw IP address, which is unusual for legitimate sites.",
    "URL uses HTTP (not HTTPS); data is not encrypted in transit."
  ],
  "explanation": "The model classified this URL as potentially phishing based on structural and lexical features of the URL string. The model assigned a phishing score of 99.93%. This score reflects the model's learned patterns and is not a calibrated real-world probability.",
  "disclaimer": "This result is produced by a machine-learning model trained on a labelled dataset. It is a screening tool and NOT a guarantee that the URL is safe or malicious. Always exercise caution with unknown URLs.",
  "scanned_at": "2026-10-21T16:04:30.460573Z"
}
```

#### Error Responses
- `422 Unprocessable Entity`: Missing URL or length outside valid bounds.
- `503 Service Unavailable`: The model artifact file was not found on disk.

---

## 3. Model Training Metrics

### `GET /api/model/metrics`
Returns current model performance stats, confusion matrix, and training metadata saved during model evaluation.

#### Response `200 OK`
```json
{
  "available": true,
  "model_name": "Logistic Regression",
  "dataset_source": "PhiUSIIL Phishing URL Dataset (UCI ML Repository, CC BY 4.0)",
  "dataset_rows": 22511,
  "train_size": 18008,
  "test_size": 4503,
  "accuracy": 1.0,
  "precision": 1.0,
  "recall": 1.0,
  "f1_score": 1.0,
  "confusion_matrix": [
    [1502, 0],
    [0, 3001]
  ],
  "class_labels": ["Legitimate", "Phishing"],
  "feature_importances": {},
  "note": null
}
```

---

## 4. Scan History Auditing

### `GET /api/history`
Fetches a list of the most recent scans stored in the SQLite database (stripped of sensitive query parameters).

#### Response `200 OK`
```json
{
  "entries": [
    {
      "id": 1,
      "url_display": "http://192.168.1.1/login.php",
      "predicted_class": "phishing",
      "risk_category": "high",
      "probability": 0.9993,
      "scanned_at": "2026-10-21T16:04:30.460573Z"
    }
  ],
  "total": 1
}
```

### `DELETE /api/history`
Purges all audit log records from the local SQLite store.

#### Response `200 OK`
```json
{
  "deleted": 1,
  "message": "Deleted 1 history record(s)."
}
```
