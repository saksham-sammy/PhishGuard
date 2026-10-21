"""
PhishGuard – FastAPI Application Entry Point
"""
from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import router
from app.core.config import get_settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s – %(message)s",
)

settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "PhishGuard – AI-Based Phishing URL Detection System. "
        "A machine-learning screening tool for academic use. "
        "Predictions are not guarantees of safety."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS – restricted to configured frontend origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Content-Type", "Accept"],
)

# Mount API routes under /api prefix
app.include_router(router, prefix="/api")


@app.on_event("startup")
async def startup_event():
    # Initialise SQLite database
    if settings.ENABLE_HISTORY:
        from app.database.db import init_db
        init_db()
        logging.getLogger(__name__).info("SQLite database initialised.")

    # Pre-load model so first request is fast
    from app.ml.model_service import get_model
    model = get_model(settings.model_file)
    if model.is_ready:
        logging.getLogger(__name__).info("Model loaded successfully.")
    else:
        logging.getLogger(__name__).warning(
            "Model artifact missing at %s – run training first.", settings.model_file
        )


@app.get("/", include_in_schema=False)
def root():
    return JSONResponse(
        {"message": f"{settings.APP_NAME} API is running. See /docs for endpoints."}
    )
