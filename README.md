# PhishGuard — AI-Based Phishing URL Detection System Using Machine Learning

## 📥 Direct Download

[![Download ZIP](https://img.shields.io/badge/Download-Source_Code_(ZIP)-2ea44f?style=for-the-badge&logo=github)](https://github.com/sammy-master/phishguard/archive/refs/heads/main.zip)

> **Quick Download**: Click the badge above to download the latest source code as a `.zip` archive directly from GitHub, or use **Code > Download ZIP**.

---


[![Python](https://img.shields.io/badge/Python-3.14-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115.5-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-3178C6.svg)](https://www.typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4.17-38B2AC.svg)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

An academic cybersecurity project engineered as a full-stack, fetch-free machine learning screening system for detecting phishing URLs. Built for technical seminars, academic vivas, and research demonstrations.

---

## 1. Project Overview

PhishGuard-Stack accepts a user-provided URL, extracts 48 multi-view structural, brand-deception, and information-theoretic features alongside character 3–5 gram TF-IDF representations without making any network request, and applies a domain-grouped out-of-fold calibrated stacking ensemble (`PhishGuard-Stack`) to predict phishing probability (**93.00% domain-disjoint accuracy**, **0.9833 ROC-AUC** on Hannousse & Yahiouche 2021; **92.25%** zero-shot on Ebbu2017; **90.33%** live recall on 2026 OpenPhish).

> [!IMPORTANT]
> **Safety Notice:** PhishGuard never makes network requests to, renders, or executes content from user-submitted URLs. It operates purely on string-derived syntax to eliminate drive-by download risks and client exploitation. This tool is a machine-learning screening aid, **not a security guarantee**.

---

## 2. Technology Stack

- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, Lucide React icons
- **Backend:** Python 3.14, FastAPI, Pydantic, Uvicorn, SQLite
- **Machine Learning:** scikit-learn, pandas, NumPy, joblib
- **Testing:** pytest, FastAPI TestClient (`httpx`)
- **Documentation & Research:** LaTeX (`IEEEtran` conference paper & technical seminar report)

---

## 3. Project Structure

```
phishguard/
├── frontend/
│   ├── src/
│   │   ├── components/      # Navbar, ScannerInput, ResultCard
│   │   ├── pages/           # ScannerPage, DashboardPage, HistoryPage, AboutPage
│   │   ├── services/        # api.ts (REST client)
│   │   ├── types/           # TypeScript interfaces
│   │   ├── App.tsx          # Root routing and health polling
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts       # Reverse proxy configuration (/api -> :8000)
│   └── tailwind.config.js   # Cybersecurity dark-navy theme
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI application entry point
│   │   ├── api/routes.py    # /health, /scan, /metrics, /history
│   │   ├── core/config.py   # Pydantic BaseSettings
│   │   ├── schemas/         # Request & response schemas
│   │   ├── ml/
│   │   │   ├── feature_extractor.py  # 48 multi-view URL deception & divergence features
│   │   │   ├── ensemble.py           # PhishGuard-Stack dual-modal calibrated ensemble
│   │   │   └── model_service.py      # Joblib model loader, calibration & attribution
│   │   └── database/db.py   # SQLite parameterized audit logging
│   ├── training/
│   │   ├── dataset_loader.py    # Real-world phishing benchmark loader
│   │   ├── feature_extraction.py# Feature pipeline for training data
│   │   ├── train_model.py       # Domain-disjoint benchmark, 9 models, baselines & ablations
│   │   └── evaluate_model.py    # Standalone evaluation script
│   ├── models/              # Saved model (.joblib) & metrics (.json)
│   ├── data/                # Real benchmark CSV/JSON/live feeds
│   ├── tests/               # 63 pytest unit and integration tests
│   └── requirements.txt
├── docs/
│   ├── ARCHITECTURE.md      # System architecture & Mermaid diagrams
│   ├── DATASET.md           # Dataset schema & 24 feature descriptions
│   ├── MODEL_EVALUATION.md  # Training metrics, F1 scores & confusion matrix
│   ├── API.md               # REST API documentation & JSON examples
│   ├── SEMINAR_DEMO_SCRIPT.md # Step-by-step Review 2 presentation script
│   └── VIVA_PREPARATION.md  # Technical Q&A preparation for seminar viva
├── paper/
│   └── paper.tex            # Full IEEE conference research paper in LaTeX
├── report/
│   └── seminar_report.tex   # Formal university seminar report in LaTeX
├── .gitignore
└── README.md
```

---

## 4. Quick Start (Windows PowerShell)

### Step 1: Clone or Navigate to the Workspace
```powershell
cd "c:\Users\admin\Desktop\VS Codes\Projects\Phishing Detection\phishguard"
```

### Step 2: Set Up Backend Environment & Dependencies
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Step 3: Train the Machine Learning Model
```powershell
python training\train_model.py
```
*Trains Logistic Regression and Random Forest classifiers, evaluates performance, and outputs `models/phishguard_model.joblib` and `models/evaluation_metrics.json`.*

### Step 4: Run the Backend Test Suite (56 Tests)
```powershell
pytest -v
```

### Step 5: Start the FastAPI Backend
```powershell
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*API is accessible at http://localhost:8000 (Swagger docs at http://localhost:8000/docs).*

### Step 6: Start the React Frontend (in a new terminal window)
```powershell
cd ..\frontend
npm install
npm run dev
```
*Frontend will launch at **http://localhost:5173** with automatic `/api` proxying to the backend.*

---

## 5. Research Paper & Seminar Report (LaTeX)

For the seminar deliverables:
- **Research Paper:** Located at `paper/paper.tex`. Formatted in IEEE conference style (`IEEEtran`) with authors: *Kedar Kapse, Ritesh Kumar, Saksham Sharma, Saurabh Singh* (Department of CSE - AI & ML, Pimpri Chinchwad University, Pune).
- **Seminar Report:** Located at `report/seminar_report.tex`. Formal report layout with Title Page, Certificate, Abstract, Chapters, and References.

Compile either document with `pdflatex`:
```powershell
cd paper
pdflatex paper.tex
```

---

## 6. API Quick Reference

| Method | Endpoint | Description |
|:------:|:---------|:------------|
| `GET` | `/api/health` | Health check and model readiness status |
| `POST` | `/api/scan` | Scan URL, extract features, predict risk |
| `GET` | `/api/model/metrics` | Retrieve model accuracy, F1, and confusion matrix |
| `GET` | `/api/history` | Retrieve privacy-sanitized scan history |
| `DELETE` | `/api/history` | Purge all scan history records |

Example scan request using PowerShell:
```powershell
$body = @{ url = "http://192.168.1.1/login.php" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:8000/api/scan" -Method Post -Body $body -ContentType "application/json"
```

---

## 7. Limitations & Responsible Use

1. **Screening Tool Only:** Model predictions reflect statistical correlations in trained datasets, not a definitive guarantee that a site is harmless or malicious.
2. **Compromised Trusted Domains:** Legitimate cloud hosting providers (e.g., forms hosted on legitimate sites) may evade lexical-only detection.
3. **No Network Handshake:** By design, PhishGuard does not inspect remote DOM trees, scripts, or certificates, trading in-depth content analysis for high speed and absolute client safety.