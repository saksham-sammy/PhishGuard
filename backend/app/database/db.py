"""
PhishGuard – SQLite database layer using sqlite3 directly.
Parameterised queries are used throughout to prevent SQL injection.
"""
from __future__ import annotations

import os
import sqlite3
from contextlib import contextmanager
from datetime import datetime
from pathlib import Path
from typing import Generator, List, Optional

from app.core.config import get_settings

settings = get_settings()


def get_db_path() -> Path:
    if os.environ.get("VERCEL"):
        return Path("/tmp/phishguard.db")
    return Path(settings.DATABASE_URL.replace("sqlite:///", ""))


def _get_connection() -> sqlite3.Connection:
    path = get_db_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(path))
    conn.row_factory = sqlite3.Row
    return conn


@contextmanager
def get_db() -> Generator[sqlite3.Connection, None, None]:
    conn = _get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db() -> None:
    """Create tables if they do not exist."""
    with get_db() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS scan_history (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                url_display     TEXT    NOT NULL,
                predicted_class TEXT    NOT NULL,
                risk_category   TEXT    NOT NULL,
                probability     REAL,
                scanned_at      TEXT    NOT NULL
            )
            """
        )


def insert_scan(
    url_display: str,
    predicted_class: str,
    risk_category: str,
    probability: Optional[float],
    scanned_at: datetime,
) -> None:
    init_db()
    with get_db() as conn:
        conn.execute(
            """
            INSERT INTO scan_history
                (url_display, predicted_class, risk_category, probability, scanned_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (url_display, predicted_class, risk_category, probability, scanned_at.isoformat()),
        )


def get_history(limit: int = 100) -> List[dict]:
    init_db()
    with get_db() as conn:
        rows = conn.execute(
            "SELECT * FROM scan_history ORDER BY id DESC LIMIT ?", (limit,)
        ).fetchall()
    return [dict(r) for r in rows]


def delete_all_history() -> int:
    init_db()
    with get_db() as conn:
        cursor = conn.execute("DELETE FROM scan_history")
    return cursor.rowcount


def _truncate_url(url: str, max_len: int = 80) -> str:
    """Return a safely shortened URL for display. Strips query strings."""
    from urllib.parse import urlparse, urlunparse
    try:
        p = urlparse(url)
        safe = urlunparse((p.scheme, p.netloc, p.path, "", "", ""))
        if len(safe) > max_len:
            safe = safe[:max_len] + "…"
        return safe
    except Exception:
        return url[:max_len]
