"""
PhishGuard – Feature Extraction Module

Extracts URL-based features that can be computed from the URL string alone,
without visiting or fetching the destination.

Feature definitions are kept identical between training and inference.
"""
from __future__ import annotations

import ipaddress
import math
import re
import unicodedata
from urllib.parse import urlparse, unquote
from typing import Dict, Any

# ---------------------------------------------------------------------------
# High-reputation root domains (Prevents false alarms on standard search & dev)
# ---------------------------------------------------------------------------
TRUSTED_ROOT_DOMAINS: frozenset[str] = frozenset(
    {
        "google.com", "google.co.in", "google.co.uk", "google.ca", "google.de",
        "google.fr", "google.com.au", "google.co.jp", "google.es", "google.it",
        "bing.com", "duckduckgo.com", "yahoo.com", "yandex.com", "baidu.com",
        "youtube.com", "wikipedia.org", "github.com", "gitlab.com",
        "microsoft.com", "apple.com", "amazon.com", "amazon.in", "amazon.co.uk",
        "linkedin.com", "reddit.com", "twitter.com", "x.com", "instagram.com",
        "facebook.com", "whatsapp.com", "netflix.com", "spotify.com",
        "overleaf.com", "ieee.org", "arxiv.org", "springer.com", "nature.com",
        "sciencedirect.com", "researchgate.net", "acm.org", "doi.org",
        "stackoverflow.com", "stackexchange.com", "medium.com", "quora.com",
        "mozilla.org", "w3.org", "pypi.org", "npmjs.com", "cloudflare.com",
        "openai.com", "anthropic.com", "chatgpt.com",
    }
)


def is_trusted_authority(hostname: str) -> tuple[bool, str]:
    """
    Check if hostname is an exact match or valid subdomain of a known trusted root domain.
    Safely rejects spoofed subdomains like 'google.com.evil.com'.
    """
    if not hostname:
        return False, ""
    host = hostname.strip().lower().split(":")[0].strip("[]")
    for root in TRUSTED_ROOT_DOMAINS:
        if host == root or host.endswith("." + root):
            return True, root
    return False, ""

URL_SHORTENERS: frozenset[str] = frozenset(
    {
        "bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd",
        "buff.ly", "adf.ly", "short.io", "rb.gy", "cutt.ly", "tiny.cc",
        "lnkd.in", "db.tt", "qr.ae", "po.st", "bc.vc", "shorte.st",
        "clk.sh", "mcaf.ee", "su.pr", "cli.gs", "url4.eu",
    }
)

# ---------------------------------------------------------------------------
# Suspicious keywords – presence is a weak signal only, not conclusive
# ---------------------------------------------------------------------------
SUSPICIOUS_KEYWORDS: frozenset[str] = frozenset(
    {
        "login", "signin", "verify", "update", "secure", "account",
        "banking", "confirm", "password", "credential", "ebayisapi",
        "webscr", "paypal", "free", "lucky", "bonus", "unlimited",
        "winner", "prize", "click", "here", "urgent", "alert",
        "suspended", "validate", "authenticate",
    }
)


def _is_ip_host(hostname: str) -> int:
    """Return 1 if hostname is a raw IPv4 or IPv6 address, else 0."""
    if not hostname:
        return 0
    host = hostname.strip()
    if host.startswith("["):
        if "]" in host:
            host = host[1:host.index("]")]
        else:
            host = host.strip("[]")
    elif ":" in host and host.count(":") == 1:
        host = host.split(":")[0]
    try:
        ipaddress.ip_address(host)
        return 1
    except ValueError:
        return 0


def _count_subdomains(hostname: str) -> int:
    """
    Return the number of labels in the hostname minus the registered domain
    parts.  We approximate by counting dots; e.g., a.b.example.com → 2 extra
    labels.  This avoids the Public Suffix List dependency while remaining
    consistent across training and inference.
    """
    if not hostname:
        return 0
    host = hostname.rsplit(":", 1)[0].strip("[]")
    parts = host.split(".")
    # Subtract 2 for the registered domain (SLD + TLD approximation)
    return max(0, len(parts) - 2)


def _count_digits(text: str) -> int:
    return sum(c.isdigit() for c in text)


def _count_special_chars(url: str) -> int:
    """Count characters that are not alphanumeric, dots, hyphens, or slashes."""
    return sum(1 for c in url if not (c.isalnum() or c in ".-/_"))


def _suspicious_keyword_count(url_lower: str) -> int:
    return sum(1 for kw in SUSPICIOUS_KEYWORDS if kw in url_lower)


def _entropy(s: str) -> float:
    """Shannon entropy of a string."""
    if not s:
        return 0.0
    prob = [s.count(c) / len(s) for c in set(s)]
    return -sum(p * math.log2(p) for p in prob if p > 0)


def extract_features(url: str) -> Dict[str, Any]:
    """
    Extract features from a URL string.

    Parameters
    ----------
    url : str
        Raw URL string submitted by the user.

    Returns
    -------
    dict
        A dictionary of feature names to numeric values.
        All values are deterministic and computed from the URL string only.
    """
    raw = url.strip()

    # Ensure a scheme for parsing; default to http if absent
    if "://" not in raw:
        parse_target = "http://" + raw
    else:
        parse_target = raw

    try:
        parsed = urlparse(parse_target)
    except Exception:
        parsed = urlparse("")

    scheme = (parsed.scheme or "").lower()
    hostname = (parsed.hostname or parsed.netloc or "").lower()
    path = parsed.path or ""
    query = parsed.query or ""
    fragment = parsed.fragment or ""
    full_url_lower = raw.lower()

    # Hostname without port
    host_no_port = hostname.rsplit(":", 1)[0].strip("[]")

    features: Dict[str, Any] = {
        # --- Length-based ---
        "url_length": len(raw),
        "hostname_length": len(host_no_port),
        "path_length": len(path),
        "query_length": len(query),

        # --- Structural ---
        "dot_count": host_no_port.count("."),
        "hyphen_count": host_no_port.count("-"),
        "underscore_count": raw.count("_"),
        "slash_count": raw.count("/"),
        "question_mark_count": raw.count("?"),
        "equal_count": raw.count("="),
        "ampersand_count": raw.count("&"),
        "at_symbol": 1 if "@" in raw else 0,
        "double_slash_redirect": 1 if raw.count("//") > 1 else 0,
        "subdomain_count": _count_subdomains(host_no_port),

        # --- Content ---
        "digit_count": _count_digits(raw),
        "special_char_count": _count_special_chars(raw),
        "suspicious_keyword_count": _suspicious_keyword_count(full_url_lower),

        # --- Scheme / host type ---
        "https": 1 if scheme == "https" else 0,
        "ip_host": _is_ip_host(hostname),
        "is_shortener": 1 if host_no_port in URL_SHORTENERS else 0,

        # --- Entropy (measures randomness in hostname) ---
        "hostname_entropy": round(_entropy(host_no_port), 4),

        # --- Misc ---
        "has_port": 1 if parsed.port is not None else 0,
        "has_fragment": 1 if fragment else 0,
        "tld_in_path": 1 if re.search(r"\.(php|html|htm|asp|aspx|jsp)", path.lower()) else 0,
    }

    return features


# Ordered list of feature names used during training – must stay fixed.
FEATURE_COLUMNS: list[str] = [
    "url_length",
    "hostname_length",
    "path_length",
    "query_length",
    "dot_count",
    "hyphen_count",
    "underscore_count",
    "slash_count",
    "question_mark_count",
    "equal_count",
    "ampersand_count",
    "at_symbol",
    "double_slash_redirect",
    "subdomain_count",
    "digit_count",
    "special_char_count",
    "suspicious_keyword_count",
    "https",
    "ip_host",
    "is_shortener",
    "hostname_entropy",
    "has_port",
    "has_fragment",
    "tld_in_path",
]


def features_to_row(url: str) -> list[float]:
    """Return features as an ordered list matching FEATURE_COLUMNS."""
    feat = extract_features(url)
    return [float(feat[col]) for col in FEATURE_COLUMNS]
