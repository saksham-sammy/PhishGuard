"""
PhishGuard – Tests for URL feature extraction

Run from phishguard/backend/:
    pytest tests/ -v
"""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.ml.feature_extractor import (
    FEATURE_COLUMNS,
    extract_features,
    features_to_row,
    _is_ip_host,
    _count_subdomains,
    URL_SHORTENERS,
)


# ---------------------------------------------------------------------------
# Basic sanity checks
# ---------------------------------------------------------------------------

class TestExtractFeatures:
    def test_returns_all_feature_columns(self):
        feat = extract_features("https://www.google.com")
        assert set(feat.keys()) >= set(FEATURE_COLUMNS)

    def test_https_scheme(self):
        feat = extract_features("https://example.com")
        assert feat["https"] == 1

    def test_http_scheme(self):
        feat = extract_features("http://example.com")
        assert feat["https"] == 0

    def test_url_length(self):
        url = "http://example.com/path"
        feat = extract_features(url)
        assert feat["url_length"] == len(url)

    def test_at_symbol_present(self):
        feat = extract_features("http://attacker.com@victim.com")
        assert feat["at_symbol"] == 1

    def test_at_symbol_absent(self):
        feat = extract_features("https://example.com/login")
        assert feat["at_symbol"] == 0

    def test_ip_host_v4(self):
        feat = extract_features("http://192.168.1.1/page")
        assert feat["ip_host"] == 1

    def test_ip_host_v6(self):
        feat = extract_features("http://[::1]/page")
        assert feat["ip_host"] == 1

    def test_ip_host_not_present(self):
        feat = extract_features("https://www.google.com")
        assert feat["ip_host"] == 0

    def test_shortener_detected(self):
        feat = extract_features("http://bit.ly/abc123")
        assert feat["is_shortener"] == 1

    def test_shortener_not_detected(self):
        feat = extract_features("https://www.example.com")
        assert feat["is_shortener"] == 0

    def test_dot_count(self):
        feat = extract_features("https://a.b.c.example.com")
        assert feat["dot_count"] == 4

    def test_hyphen_count(self):
        feat = extract_features("https://my-secure-login.example.com")
        assert feat["hyphen_count"] == 2

    def test_has_port(self):
        feat = extract_features("http://example.com:8080/path")
        assert feat["has_port"] == 1

    def test_no_port(self):
        feat = extract_features("https://example.com/path")
        assert feat["has_port"] == 0

    def test_query_length(self):
        feat = extract_features("http://example.com/search?q=hello&lang=en")
        assert feat["query_length"] > 0

    def test_fragment(self):
        feat = extract_features("https://example.com/page#section")
        assert feat["has_fragment"] == 1

    def test_no_fragment(self):
        feat = extract_features("https://example.com/page")
        assert feat["has_fragment"] == 0

    def test_double_slash_redirect(self):
        feat = extract_features("http://example.com//redirect?url=evil.com")
        assert feat["double_slash_redirect"] == 1

    def test_tld_in_path(self):
        feat = extract_features("http://example.com/login.php")
        assert feat["tld_in_path"] == 1


# ---------------------------------------------------------------------------
# Edge / malformed inputs
# ---------------------------------------------------------------------------

class TestEdgeCases:
    def test_empty_url_no_crash(self):
        feat = extract_features("")
        assert isinstance(feat, dict)

    def test_url_no_scheme(self):
        feat = extract_features("example.com/path")
        assert isinstance(feat, dict)

    def test_very_long_url(self):
        url = "http://example.com/" + "a" * 2000
        feat = extract_features(url)
        assert feat["url_length"] > 2000

    def test_url_with_port_ip(self):
        feat = extract_features("http://10.0.0.1:9000/admin")
        assert feat["ip_host"] == 1
        assert feat["has_port"] == 1

    def test_url_with_credentials(self):
        feat = extract_features("ftp://user:pass@example.com/file")
        assert feat["at_symbol"] == 1

    def test_internationalized_domain(self):
        # Should not crash
        feat = extract_features("https://xn--p1ai.ru/path")
        assert isinstance(feat, dict)

    def test_malformed_url(self):
        feat = extract_features("not a url at all!!!")
        assert isinstance(feat, dict)

    def test_suspicious_keywords_counted(self):
        feat = extract_features("http://secure-login-verify.example.com")
        assert feat["suspicious_keyword_count"] >= 2


# ---------------------------------------------------------------------------
# features_to_row
# ---------------------------------------------------------------------------

class TestFeaturesToRow:
    def test_returns_correct_length(self):
        row = features_to_row("https://example.com")
        assert len(row) == len(FEATURE_COLUMNS)

    def test_all_numeric(self):
        row = features_to_row("https://example.com/path?q=1")
        assert all(isinstance(v, float) for v in row)

    def test_deterministic(self):
        url = "https://my-bank-secure-login.example.com/verify?user=abc"
        assert features_to_row(url) == features_to_row(url)


# ---------------------------------------------------------------------------
# IP host helper
# ---------------------------------------------------------------------------

class TestIsIpHost:
    def test_ipv4(self):   assert _is_ip_host("192.168.0.1") == 1
    def test_ipv6(self):   assert _is_ip_host("[::1]") == 1
    def test_domain(self): assert _is_ip_host("example.com") == 0
    def test_empty(self):  assert _is_ip_host("") == 0


# ---------------------------------------------------------------------------
# Subdomain counter
# ---------------------------------------------------------------------------

class TestCountSubdomains:
    def test_no_subdomain(self):   assert _count_subdomains("example.com") == 0
    def test_one_subdomain(self):  assert _count_subdomains("www.example.com") == 1
    def test_deep_subdomain(self): assert _count_subdomains("a.b.c.example.com") == 3
    def test_empty(self):          assert _count_subdomains("") == 0
