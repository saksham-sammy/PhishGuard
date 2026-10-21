"""
PhishGuard — Operational Command Line Interface (CLI)

Enables rapid, fetch-free URL screening from the terminal with support for:
  - Formats: text, json, compact
  - Verbose feature inspection (--verbose)
  - Color toggle (--no-color)
  - Configurable thresholding and multi-tier simulation

Usage:
    python main.py https://www.google.com --format text
    python main.py http://paypal-secure-login.com --format text --verbose
    python main.py https://www.github.com --format json
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

# Add backend directory to sys.path so app imports resolve
BACKEND_DIR = Path(__file__).parent / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from app.ml.feature_extractor import extract_features, FEATURE_COLUMNS
from app.ml.model_service import get_model, PhishGuardModel, ModelNotReadyError


# ANSI color codes
CYAN   = "\033[96m"
GREEN  = "\033[92m"
YELLOW = "\033[93m"
RED    = "\033[91m"
BOLD   = "\033[1m"
DIM    = "\033[2m"
RESET  = "\033[0m"


def format_text(result: dict, verbose: bool, no_color: bool) -> str:
    c_bold   = "" if no_color else BOLD
    c_reset  = "" if no_color else RESET
    c_dim    = "" if no_color else DIM
    c_cyan   = "" if no_color else CYAN

    is_phish = result["predicted_class"] == "phishing"
    risk_cat = result["risk_category"].upper()

    if is_phish:
        status_color = "" if no_color else RED
        status_icon  = "[!]"
    elif risk_cat == "MEDIUM":
        status_color = "" if no_color else YELLOW
        status_icon  = "[?]"
    else:
        status_color = "" if no_color else GREEN
        status_icon  = "[*]"

    score_pct = f"{result['probability'] * 100:.1f}%" if result.get("probability") is not None else "N/A"

    lines = [
        f"{c_bold}============================================================{c_reset}",
        f"{c_cyan}{c_bold}  PhishGuard — URL Security Assessment{c_reset}",
        f"{c_bold}============================================================{c_reset}",
        f"  Target URL       : {result['url']}",
        f"  Scan Timestamp   : {result['scanned_at']}",
        f"  Assessment       : {status_color}{c_bold}{status_icon} {result['predicted_class'].upper()} ({risk_cat} RISK){c_reset}",
        f"  Model Score      : {score_pct}",
        f"  Available Tiers  : Tier-1 (URL Analyzer: Active), Tier-2 (HTML: Standby), Tier-3 (Logo: Standby)",
        f"  Confidence Level : Medium (1/3 active tiers, fetch-free mode)",
        f"{c_dim}------------------------------------------------------------{c_reset}",
        f"  Explanation      : {result['explanation']}",
    ]

    if result.get("warnings"):
        lines.append(f"{c_dim}------------------------------------------------------------{c_reset}")
        lines.append(f"  {c_bold}Identified Warning Indicators:{c_reset}")
        for w in result["warnings"]:
            lines.append(f"    - {w}")

    if verbose and "features" in result:
        lines.append(f"{c_dim}------------------------------------------------------------{c_reset}")
        lines.append(f"  {c_bold}Feature Inspection Breakdown (Tier-1 Lexical Vectors):{c_reset}")
        for k, v in result["features"].items():
            lines.append(f"    {k:<28}: {v}")

    lines.append(f"{c_dim}------------------------------------------------------------{c_reset}")
    lines.append(f"  {c_dim}Disclaimer: Machine-learning screening estimate only.{c_reset}")
    lines.append(f"{c_bold}============================================================{c_reset}")

    return "\n".join(lines)


def format_compact(result: dict) -> str:
    prob = f"{result['probability']:.4f}" if result.get("probability") is not None else "NaN"
    return f"{result['predicted_class'].upper()}|risk={result['risk_category']}|score={prob}|url={result['url']}"


def main() -> int:
    parser = argparse.ArgumentParser(
        description="PhishGuard — Command Line URL Phishing Detector",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("url", help="URL to scan and assess")
    parser.add_argument(
        "--format",
        choices=["text", "json", "compact"],
        default="text",
        help="Output serialization format (default: text)",
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Output raw Tier-1 engineered feature vector",
    )
    parser.add_argument(
        "--no-color",
        action="store_true",
        help="Disable ANSI terminal colors",
    )
    parser.add_argument(
        "--version",
        action="version",
        version="PhishGuard CLI 1.0.0 (Research Edition)",
    )

    args = parser.parse_args()

    # Load model
    model_path = BACKEND_DIR / "models" / "phishguard_model.joblib"
    model = get_model(model_path)

    if not model.is_ready:
        sys.stderr.write(
            f"[ERROR] Trained model artifact not found at {model_path}.\n"
            "Please run `python backend/training/train_model.py` first.\n"
        )
        return 1

    try:
        res = model.predict(args.url)
    except ModelNotReadyError as e:
        sys.stderr.write(f"[ERROR] {e}\n")
        return 1
    except Exception as exc:
        sys.stderr.write(f"[ERROR] Unexpected inference failure: {exc}\n")
        return 1

    res["url"] = args.url
    res["scanned_at"] = datetime.now(timezone.utc).isoformat()
    res["aggregation"] = {
        "available_tiers": ["url"],
        "weights_used": {"url": 1.0, "html": 0.0, "logo": 0.0},
        "normalized_weight_sum": 1.0,
        "confidence": "Medium",
    }

    if args.format == "json":
        print(json.dumps(res, indent=2))
    elif args.format == "compact":
        print(format_compact(res))
    else:
        print(format_text(res, verbose=args.verbose, no_color=args.no_color))

    return 0


if __name__ == "__main__":
    sys.exit(main())
