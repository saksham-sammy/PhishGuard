# PhishGuard — Frontend

React + Vite + TypeScript + Tailwind CSS

## Quick Start

```powershell
cd phishguard\frontend
npm install
npm run dev
# → http://localhost:5173
```

## Pages

| Page | Route (SPA tab) | Description |
|------|----------------|-------------|
| **Scanner** | default | URL input, real-time scan result |
| **Model Dashboard** | dashboard | Accuracy, F1, confusion matrix from backend |
| **History** | history | Past scans (requires backend + SQLite) |
| **About** | about | Project description, methodology, limitations |

## Backend Connection

The frontend proxies `/api/*` to `http://localhost:8000` (FastAPI).
Start the backend first; the **API status pill** in the navbar shows live connectivity.

## Build for Production

```powershell
npm run build   # outputs to dist/
```
