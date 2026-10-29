"""
PhishGuard – Multi-View Deception-Aware URL Feature Extraction Module

Computes 48 deterministic, strictly fetch-free features from a raw URL string:
  - View I   (24 features): Classical lexical, length, character-count & flag primitives
  - View II  ( 8 features): Public-suffix-aware topology, www placement & ratios
  - View III ( 8 features): Homoglyph-normalized brand-domain spoofing & host/TLD abuse
  - View IV  ( 8 features): Information-theoretic KL-divergence & character morphology

Zero network I/O is performed during feature extraction.
"""
from __future__ import annotations

import ipaddress
import math
import re
from functools import lru_cache
from typing import Any, Dict, Tuple
from urllib.parse import urlparse

# ---------------------------------------------------------------------------
# Multi-label effective Top-Level Domains (eTLDs) for accurate SLD extraction
# ---------------------------------------------------------------------------
MULTI_LABEL_TLDS: frozenset[str] = frozenset(
    {
        "co.uk", "org.uk", "ac.uk", "gov.uk", "me.uk", "net.uk",
        "co.in", "ac.in", "gov.in", "org.in", "res.in", "net.in", "edu.in", "nic.in",
        "com.au", "net.au", "org.au", "edu.au", "gov.au",
        "co.jp", "ne.jp", "or.jp", "ac.jp", "go.jp",
        "com.br", "org.br", "edu.br", "gov.br", "net.br",
        "co.za", "org.za", "ac.za", "gov.za",
        "co.nz", "org.nz", "ac.nz", "govt.nz",
        "com.sg", "edu.sg", "gov.sg", "org.sg",
        "com.hk", "edu.hk", "org.hk", "gov.hk",
        "com.my", "edu.my", "gov.my", "org.my",
        "com.mx", "gob.mx", "edu.mx", "org.mx",
        "com.tr", "edu.tr", "gov.tr", "org.tr",
        "com.cn", "edu.cn", "gov.cn", "org.cn", "net.cn",
        "co.kr", "or.kr", "ac.kr", "go.kr",
        "co.il", "org.il", "ac.il", "gov.il",
        "com.ar", "gob.ar", "edu.ar", "org.ar",
        "com.pk", "edu.pk", "gov.pk", "org.pk",
        "com.bd", "edu.bd", "gov.bd", "org.bd",
        "com.ng", "edu.ng", "gov.ng", "org.ng",
        "com.pl", "edu.pl", "gov.pl", "org.pl",
        "com.ru", "org.ru", "net.ru",
        "com.ua", "org.ua", "edu.ua", "gov.ua",
        "com.tw", "edu.tw", "gov.tw", "org.tw",
        "com.vn", "edu.vn", "gov.vn", "org.vn",
        "co.id", "ac.id", "go.id", "or.id",
        "co.th", "ac.th", "go.th", "in.th",
        "com.ph", "edu.ph", "gov.ph", "org.ph",
    }
)

# Commonly embedded TLD tokens used in subdomain-cloaking attacks
# e.g., accounts.google.com.verify-session.top or apple.com-app.es
EMBEDDED_TLD_TOKENS: frozenset[str] = frozenset(
    {"com", "net", "org", "edu", "gov", "mil", "co", "io", "uk", "de", "fr", "ru", "jp"}
)

# High-abuse TLD registry (APWG / Spamhaus empirical abuse rankings)
SUSPICIOUS_TLDS: frozenset[str] = frozenset(
    {
        "tk", "ml", "ga", "cf", "gq", "xyz", "top", "pw", "icu", "cfd",
        "sbs", "buzz", "click", "link", "work", "support", "rest", "fit",
        "bid", "stream", "download", "win", "vip", "loan", "men", "date",
        "racing", "party", "review", "trade", "accountant", "science",
        "kim", "country", "mom", "xin", "gdn", "jetzt", "cyou", "monster",
        "quest", "beauty", "hair", "makeup", "boats", "autos", "homes",
    }
)

# Ephemeral / multi-tenant free hosting, cloud preview & dynamic DNS suffixes
SHARED_HOSTING_SUFFIXES: frozenset[str] = frozenset(
    {
        "000webhostapp.com", "pages.dev", "web.app", "firebaseapp.com",
        "netlify.app", "vercel.app", "github.io", "gitlab.io",
        "herokuapp.com", "blogspot.com", "wordpress.com", "wixsite.com",
        "weebly.com", "webflow.io", "myftp.org", "myftp.biz", "ddns.net",
        "duckdns.org", "no-ip.org", "no-ip.biz", "hopto.org", "zapto.org",
        "sytes.net", "servehttp.com", "ngrok-free.app", "ngrok.io",
        "workers.dev", "surge.sh", "glitch.me", "trycloudflare.com",
        "azurewebsites.net", "appspot.com", "repl.co", "replit.dev",
        "onrender.com", "fly.dev", "railway.app", "cyclic.app",
        "freecluster.eu", "epizy.com", "rf.gd", "infinityfreeapp.com",
        "awardspace.info", "atwebpages.com", "altervista.org",
    }
)

# High-reputation verified domains (strictly excludes multi-tenant user hosting)
TRUSTED_ROOT_DOMAINS: frozenset[str] = frozenset(
    {
        "google.com", "google.co.in", "google.co.uk", "google.ca", "google.de",
        "google.fr", "google.com.au", "google.co.jp", "google.es", "google.it",
        "bing.com", "duckduckgo.com", "yahoo.com", "yandex.com", "baidu.com",
        "youtube.com", "wikipedia.org", "wikimedia.org", "github.com", "gitlab.com",
        "microsoft.com", "apple.com", "amazon.com", "amazon.in", "amazon.co.uk",
        "linkedin.com", "reddit.com", "twitter.com", "x.com", "instagram.com",
        "facebook.com", "whatsapp.com", "netflix.com", "spotify.com",
        "overleaf.com", "ieee.org", "arxiv.org", "springer.com", "nature.com",
        "sciencedirect.com", "researchgate.net", "acm.org", "doi.org",
        "stackoverflow.com", "stackexchange.com", "mozilla.org", "w3.org",
        "python.org", "pypi.org", "npmjs.com", "cloudflare.com",
        "openai.com", "anthropic.com", "chatgpt.com",
    }
)

# Target brand lexicon and their legitimate sibling SLDs (to prevent false spoofing flags)
BRAND_OWNERS: Dict[str, frozenset[str]] = {
    "google": frozenset({"google", "googleapis", "googleusercontent", "gstatic", "youtube", "youtu", "gmail", "blogger", "chromium", "android", "golang"}),
    "gmail": frozenset({"gmail", "google"}),
    "youtube": frozenset({"youtube", "youtu", "ytimg", "google"}),
    "apple": frozenset({"apple", "icloud", "mzstatic", "cdn-apple", "itunes"}),
    "appleid": frozenset({"apple", "icloud"}),
    "icloud": frozenset({"icloud", "apple"}),
    "paypal": frozenset({"paypal", "paypalobjects", "braintreegateway", "venmo"}),
    "microsoft": frozenset({"microsoft", "office", "office365", "live", "outlook", "onedrive", "azure", "msn", "bing", "visualstudio", "sharepoint", "windows", "xbox", "skype", "linkedin", "github"}),
    "office365": frozenset({"office365", "office", "microsoft", "live", "sharepoint"}),
    "onedrive": frozenset({"onedrive", "live", "microsoft", "sharepoint"}),
    "outlook": frozenset({"outlook", "live", "office", "microsoft", "hotmail"}),
    "amazon": frozenset({"amazon", "amazonaws", "aws", "cloudfront", "audible", "imdb", "twitch", "primevideo", "a2z"}),
    "netflix": frozenset({"netflix", "nflxext", "nflximg", "nflxso", "nflxvideo"}),
    "facebook": frozenset({"facebook", "fb", "fbcdn", "instagram", "whatsapp", "meta", "messenger"}),
    "instagram": frozenset({"instagram", "cdninstagram", "facebook", "meta"}),
    "whatsapp": frozenset({"whatsapp", "facebook", "meta"}),
    "linkedin": frozenset({"linkedin", "licdn", "microsoft"}),
    "dropbox": frozenset({"dropbox", "dropboxusercontent", "dropboxstatic", "db"}),
    "adobe": frozenset({"adobe", "adobelogin", "behance", "typekit", "acrobat"}),
    "docusign": frozenset({"docusign", "docusignhq"}),
    "yahoo": frozenset({"yahoo", "yimg", "ymail", "aol", "flickr"}),
    "chase": frozenset({"chase", "jpmorgan", "jpmorganchase"}),
    "wellsfargo": frozenset({"wellsfargo", "wf"}),
    "citibank": frozenset({"citibank", "citi", "citigroup", "citicards"}),
    "bankofamerica": frozenset({"bankofamerica", "bofa", "ml"}),
    "hsbc": frozenset({"hsbc"}),
    "barclays": frozenset({"barclays", "barclaycard"}),
    "santander": frozenset({"santander", "santanderbank"}),
    "hdfcbank": frozenset({"hdfcbank", "hdfc"}),
    "icicibank": frozenset({"icicibank", "icici"}),
    "axisbank": frozenset({"axisbank"}),
    "paytm": frozenset({"paytm", "paytmbank"}),
    "binance": frozenset({"binance", "bnbstatic"}),
    "coinbase": frozenset({"coinbase"}),
    "metamask": frozenset({"metamask", "consensys"}),
    "blockchain": frozenset({"blockchain"}),
    "steam": frozenset({"steampowered", "steamcommunity", "steamstatic", "valve"}),
    "steamcommunity": frozenset({"steamcommunity", "steampowered", "valve"}),
    "discord": frozenset({"discord", "discordapp", "discordcdn"}),
    "telegram": frozenset({"telegram", "t"}),
    "stripe": frozenset({"stripe", "stripecdn"}),
    "ebay": frozenset({"ebay", "ebayimg", "ebaystatic", "ebayrtm"}),
    "dhl": frozenset({"dhl"}),
    "fedex": frozenset({"fedex"}),
    "usps": frozenset({"usps"}),
    "github": frozenset({"github", "githubusercontent", "githubassets", "npmjs"}),
    "gitlab": frozenset({"gitlab", "gitlab-static"}),
}

BRAND_KEYS: tuple[str, ...] = tuple(BRAND_OWNERS.keys())

URL_SHORTENERS: frozenset[str] = frozenset(
    {
        "bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd",
        "buff.ly", "adf.ly", "short.io", "rb.gy", "cutt.ly", "tiny.cc",
        "lnkd.in", "db.tt", "qr.ae", "po.st", "bc.vc", "shorte.st",
        "clk.sh", "mcaf.ee", "su.pr", "cli.gs", "url4.eu", "rebrand.ly",
        "bl.ink", "v.gd", "shorturl.at", "t.ly",
    }
)

SUSPICIOUS_KEYWORDS: frozenset[str] = frozenset(
    {
        "login", "signin", "logon", "verify", "verification", "update",
        "secure", "security", "account", "banking", "confirm", "password",
        "passwd", "credential", "ebayisapi", "webscr", "paypal", "free",
        "lucky", "bonus", "unlimited", "winner", "prize", "urgent",
        "alert", "suspended", "suspend", "validate", "authenticate",
        "unlock", "restore", "recovery", "wallet", "billing", "invoice",
    }
)

# Empirical character frequencies of benign domain names (Laplace-smoothed prior Q)
_RAW_DOMAIN_CHAR_PRIOR: Dict[str, float] = {
    "e": 0.112, "a": 0.092, "o": 0.081, "i": 0.078, "n": 0.072,
    "s": 0.071, "r": 0.068, "t": 0.067, "l": 0.052, "c": 0.048,
    "u": 0.036, "m": 0.034, "d": 0.033, "p": 0.031, "g": 0.025,
    "h": 0.024, "b": 0.021, "f": 0.015, "y": 0.015, "v": 0.012,
    "k": 0.011, "w": 0.011, "x": 0.005, "z": 0.004, "j": 0.004,
    "q": 0.003,
    "0": 0.004, "1": 0.004, "2": 0.004, "3": 0.003, "4": 0.003,
    "5": 0.002, "6": 0.002, "7": 0.002, "8": 0.002, "9": 0.002,
}
_PRIOR_SUM = sum(_RAW_DOMAIN_CHAR_PRIOR.values())
BENIGN_CHAR_PRIOR: Dict[str, float] = {k: v / _PRIOR_SUM for k, v in _RAW_DOMAIN_CHAR_PRIOR.items()}

_LEET_TABLE_L = str.maketrans({"0": "o", "1": "l", "3": "e", "4": "a", "5": "s", "7": "t", "8": "b"})
_LEET_TABLE_I = str.maketrans({"0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "8": "b"})
_TOKEN_SPLIT_RE = re.compile(r"[^a-z0-9]+")
_SCRIPT_EXT_RE = re.compile(r"\.(php|html|htm|asp|aspx|jsp|cgi|exe|scr|bat|dll)(?:$|[/?#])")
_VOWELS = frozenset("aeiou")


def is_trusted_authority(hostname: str) -> tuple[bool, str]:
    """
    Check if hostname is an exact match or valid subdomain of a verified root domain,
    explicitly excluding multi-tenant shared hosting suffixes.
    """
    if not hostname:
        return False, ""
    host = hostname.strip().lower().split(":")[0].strip("[]").rstrip(".")
    for shared in SHARED_HOSTING_SUFFIXES:
        if host == shared or host.endswith("." + shared):
            return False, ""
    for root in TRUSTED_ROOT_DOMAINS:
        if host == root or host.endswith("." + root):
            return True, root
    return False, ""


def _is_ip_host(hostname: str) -> int:
    """Return 1 if hostname is a raw IPv4 or IPv6 literal, else 0."""
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


@lru_cache(maxsize=32768)
def split_registrable_domain(hostname: str) -> Tuple[str, str, str]:
    """
    Decompose hostname (without port) into (subdomain_prefix, registrable_sld, effective_tld).
    Respects multi-label public suffixes such as .co.in, .ac.in, .co.uk, .com.au.
    """
    if not hostname:
        return "", "", ""
    host = hostname.strip().lower().rsplit(":", 1)[0].strip("[]").rstrip(".")
    if not host or _is_ip_host(host):
        return "", host, ""
    parts = [p for p in host.split(".") if p]
    if len(parts) == 1:
        return "", parts[0], ""
    last_two = f"{parts[-2]}.{parts[-1]}"
    if len(parts) >= 3 and last_two in MULTI_LABEL_TLDS:
        tld = last_two
        sld = parts[-3]
        sub = ".".join(parts[:-3])
    else:
        tld = parts[-1]
        sld = parts[-2]
        sub = ".".join(parts[:-2])
    return sub, sld, tld


def _count_subdomains(hostname: str) -> int:
    """Return public-suffix-aware count of subdomain labels before registrable root."""
    if not hostname:
        return 0
    sub, _, _ = split_registrable_domain(hostname)
    if not sub:
        return 0
    return len([p for p in sub.split(".") if p])


def _levenshtein_bounded(a: str, b: str, max_dist: int = 3) -> int:
    """Fast length-pruned Levenshtein edit distance with early exit."""
    la, lb = len(a), len(b)
    if abs(la - lb) > max_dist:
        return max_dist + 1
    if a == b:
        return 0
    if la > lb:
        a, b = b, a
        la, lb = lb, la
    prev = list(range(lb + 1))
    for i, ca in enumerate(a, 1):
        curr = [i] + [0] * lb
        row_min = curr[0]
        for j, cb in enumerate(b, 1):
            cost = 0 if ca == cb else 1
            val = min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost)
            curr[j] = val
            if val < row_min:
                row_min = val
        if row_min > max_dist:
            return max_dist + 1
        prev = curr
    return prev[lb]


def _canonical_variants(token: str) -> tuple[str, ...]:
    """Generate homoglyph / leetspeak canonical forms for visual confusable matching."""
    v1 = token.translate(_LEET_TABLE_L)
    v2 = token.translate(_LEET_TABLE_I)
    v3 = v1.replace("rn", "m").replace("vv", "w")
    # Deduplicate while preserving order
    out = [token]
    for v in (v1, v2, v3):
        if v not in out:
            out.append(v)
    return tuple(out)


_BENIGN_WORD_EXCLUSIONS: frozenset[str] = frozenset(
    {
        "apply", "applied", "applies", "team", "teams", "stream", "streams",
        "streaming", "phase", "phases", "strip", "strips", "stripey",
        "chasey", "chased", "chasing", "uses", "used", "adobes",
    }
)


@lru_cache(maxsize=32768)
def _best_brand_similarity(token: str, allow_fuzzy: bool = True) -> Tuple[float, str]:
    """
    Return (max_similarity, matched_brand) for an alphanumeric token against BRAND_KEYS
    under homoglyph canonicalization and length-gated bounded Levenshtein distance.
    """
    if len(token) < 4 or len(token) > 24 or token in _BENIGN_WORD_EXCLUSIONS:
        return 0.0, ""
    if token in BRAND_OWNERS:
        return 1.0, token

    variants = _canonical_variants(token)
    for v in variants:
        if v in BRAND_OWNERS:
            return 0.96, v

    if not allow_fuzzy:
        return 0.0, ""

    best_sim = 0.0
    best_brand = ""
    for brand in BRAND_KEYS:
        lb = len(brand)
        if lb < 5:
            continue
        allowed_dist = 2 if min(len(token), lb) >= 8 else 1
        if abs(len(token) - lb) > allowed_dist:
            continue
        for v in variants:
            if v in _BENIGN_WORD_EXCLUSIONS:
                continue
            max_len = max(len(v), lb)
            if abs(len(v) - lb) > allowed_dist:
                continue
            dist = _levenshtein_bounded(v, brand, max_dist=allowed_dist)
            if dist <= allowed_dist:
                sim = 1.0 - (dist / max_len)
                if sim > best_sim:
                    best_sim = sim
                    best_brand = brand
    return round(best_sim, 4), best_brand


def _is_shared_hosting(host: str) -> int:
    if not host:
        return 0
    for sfx in SHARED_HOSTING_SUFFIXES:
        if host == sfx or host.endswith("." + sfx):
            return 1
    return 0


def _compute_brand_deception(
    sub: str, sld: str, path: str, is_shared: int
) -> Tuple[float, float, int]:
    """
    Compute:
      1. brand_spoof_score   (Delta_brand in [0, 1]): Brand token in subdomain/path/compound-SLD
         when registrable SLD is NOT an authorized owner of that brand.
      2. sld_typosquat_score (tau_typo in [0, 1]): Direct typosquatting/homoglyph similarity on SLD.
      3. brand_in_subdomain  (binary 0/1): Strong brand impersonation in subdomain or compound SLD.
    """
    effective_owner = "" if is_shared else sld

    # 1. Direct SLD typosquatting check (whole SLD or hyphen-stripped SLD close to a brand, but not owned)
    sld_clean = sld.replace("-", "")
    typo_score = 0.0
    for candidate in (sld, sld_clean):
        if len(candidate) < 4:
            continue
        sim, b_match = _best_brand_similarity(candidate, allow_fuzzy=True)
        if b_match and effective_owner not in BRAND_OWNERS[b_match]:
            if candidate != b_match or "-" in sld:
                if sim >= 0.78 and sim > typo_score:
                    typo_score = sim

    # 2. Subdomain, compound-SLD token, and path brand spoofing divergence
    sub_tokens = [t for t in _TOKEN_SPLIT_RE.split(sub) if len(t) >= 4]
    sld_subtokens = [t for t in _TOKEN_SPLIT_RE.split(sld) if len(t) >= 4] if ("-" in sld or is_shared) else []
    path_tokens = [t for t in _TOKEN_SPLIT_RE.split(path.lower()) if 4 <= len(t) <= 20][:12]

    spoof_score = 0.0
    in_sub_flag = 0

    for tok in sub_tokens + sld_subtokens:
        sim, b_match = _best_brand_similarity(tok, allow_fuzzy=True)
        if b_match and effective_owner not in BRAND_OWNERS[b_match] and sim >= 0.80:
            if sim > spoof_score:
                spoof_score = sim
            if sim >= 0.84:
                in_sub_flag = 1

    # Check embedded brand substring inside unseparated host labels (e.g., paypalsecurelogin)
    if spoof_score < 0.90:
        host_examine = f"{sub}.{sld}" if sub else sld
        for brand in BRAND_KEYS:
            if len(brand) >= 5 and brand in host_examine:
                if effective_owner not in BRAND_OWNERS[brand]:
                    spoof_score = max(spoof_score, 0.92)
                    if brand in sub or "-" in sld or host_examine != brand:
                        in_sub_flag = 1

    # Path tokens use exact/homoglyph matching only (avoiding natural-language false positives)
    for tok in path_tokens:
        sim, b_match = _best_brand_similarity(tok, allow_fuzzy=False)
        if b_match and effective_owner not in BRAND_OWNERS[b_match] and sim >= 0.95:
            weighted = round(sim * 0.90, 4)
            if weighted > spoof_score:
                spoof_score = weighted

    return round(spoof_score, 4), round(typo_score, 4), in_sub_flag


def _count_digits(text: str) -> int:
    return sum(c.isdigit() for c in text)


def _count_special_chars(url: str) -> int:
    """Count characters that are not alphanumeric, dots, hyphens, underscores, or slashes."""
    return sum(1 for c in url if not (c.isalnum() or c in ".-/_"))


def _suspicious_keyword_count(text_lower: str) -> int:
    return sum(1 for kw in SUSPICIOUS_KEYWORDS if kw in text_lower)


def _entropy(s: str) -> float:
    """Shannon entropy H(s) in bits per character."""
    if not s:
        return 0.0
    n = len(s)
    counts: Dict[str, int] = {}
    for ch in s:
        counts[ch] = counts.get(ch, 0) + 1
    return -sum((cnt / n) * math.log2(cnt / n) for cnt in counts.values())


def _hostname_kl_divergence(host: str, alpha: float = 5.0) -> float:
    """
    Dirichlet-smoothed Kullback-Leibler divergence D_KL(P_tilde || Q_benign) over
    alphanumeric characters of the hostname core (stripping leading 'www.'), quantifying
    deviation from natural English domain character priors without short-string inflation.
    """
    core = host.lower()
    if core.startswith("www."):
        core = core[4:]
    an = [c for c in core if c.isalnum() and c.isascii()]
    if not an:
        return 0.0
    n = len(an)
    counts: Dict[str, int] = {}
    for c in an:
        counts[c] = counts.get(c, 0) + 1
    denom = n + alpha
    kl = 0.0
    for c, q in BENIGN_CHAR_PRIOR.items():
        p_tilde = (counts.get(c, 0) + alpha * q) / denom
        kl += p_tilde * math.log2(p_tilde / q)
    return round(max(0.0, kl), 4)


def _char_class(ch: str) -> int:
    if ch.isalpha():
        return 0
    if ch.isdigit():
        return 1
    return 2


def _char_transition_rate(host: str) -> float:
    """Fraction of adjacent character pairs in hostname switching between alpha/digit/symbol."""
    if len(host) <= 1:
        return 0.0
    switches = sum(
        1 for i in range(len(host) - 1) if _char_class(host[i]) != _char_class(host[i + 1])
    )
    return round(switches / (len(host) - 1), 4)


def _vowel_ratio(host: str) -> float:
    """Ratio of vowels to alphabetic characters in hostname."""
    alpha = [c for c in host.lower() if c.isalpha()]
    if not alpha:
        return 0.0
    return round(sum(1 for c in alpha if c in _VOWELS) / len(alpha), 4)


def _max_consonant_run(host: str) -> int:
    """Longest contiguous run of non-vowel ASCII letters in hostname."""
    best = 0
    cur = 0
    for ch in host.lower():
        if ch.isalpha() and ch.isascii() and ch not in _VOWELS:
            cur += 1
            if cur > best:
                best = cur
        else:
            cur = 0
    return best


def _has_tld_in_subdomain(sub: str, sld: str) -> int:
    """Detect embedded TLD tokens in subdomain or hyphenated SLD (e.g., google.com.evil.top or apple.com-app.es)."""
    sub_tokens = [t for t in _TOKEN_SPLIT_RE.split(sub) if t]
    for tok in sub_tokens:
        if tok in EMBEDDED_TLD_TOKENS:
            return 1
    if "-" in sld:
        sld_parts = [t for t in sld.split("-") if t]
        for tok in sld_parts:
            if tok in EMBEDDED_TLD_TOKENS:
                return 1
    return 0


def extract_features(url: str) -> Dict[str, Any]:
    """
    Extract all 48 fetch-free multi-view features from a raw URL string.
    """
    raw = url.strip()

    if "://" not in raw:
        parse_target = "http://" + raw
    else:
        parse_target = raw

    try:
        parsed = urlparse(parse_target)
    except Exception:
        parsed = urlparse("")

    scheme = (parsed.scheme or "").lower()
    netloc_raw = parsed.netloc or ""
    hostname = (parsed.hostname or netloc_raw or "").lower()
    path = parsed.path or ""
    query = parsed.query or ""
    fragment = parsed.fragment or ""
    full_url_lower = raw.lower()

    host_no_port = hostname.rsplit(":", 1)[0].strip("[]")
    try:
        has_port = 1 if parsed.port is not None else 0
    except ValueError:
        has_port = 0

    is_ip = _is_ip_host(hostname)
    sub, sld, tld = split_registrable_domain(host_no_port)
    is_shared = _is_shared_hosting(host_no_port)

    # Path & token structure
    path_segments = [seg for seg in path.split("/") if seg]
    all_tokens = [t for t in _TOKEN_SPLIT_RE.split(f"{host_no_port}/{path.lower()}") if t]
    longest_tok = max((len(t) for t in all_tokens), default=0)

    # www canonical vs deceptive placement (e.g. www-paypal.com or login.www.evil.com)
    has_www_flag = 1 if (sub == "www" or sub.startswith("www.")) else 0
    sub_non_leading_www = sub[4:] if sub.startswith("www.") else ("" if sub == "www" else sub)
    www_misplaced_flag = 1 if ("www" in sld or "www" in sub_non_leading_www) else 0

    # Brand spoofing & homoglyph typosquatting metrics
    if is_ip:
        brand_spoof, sld_typo, brand_sub = 0.0, 0.0, 0
    else:
        brand_spoof, sld_typo, brand_sub = _compute_brand_deception(sub, sld, path, is_shared)

    tld_leaf = tld.split(".")[-1] if tld else ""
    suspicious_tld_flag = 1 if (tld_leaf in SUSPICIOUS_TLDS and tld not in MULTI_LABEL_TLDS) else 0
    punycode_flag = 1 if ("xn--" in host_no_port or any(ord(c) > 127 for c in host_no_port)) else 0
    host_digits = _count_digits(host_no_port)
    url_len = max(1, len(raw))

    features: Dict[str, Any] = {
        # --- View I: Classical Lexical, Length & Flag Primitives (24) ---
        "url_length": len(raw),
        "hostname_length": len(host_no_port),
        "path_length": len(path),
        "query_length": len(query),
        "dot_count": host_no_port.count("."),
        "hyphen_count": host_no_port.count("-"),
        "underscore_count": raw.count("_"),
        "slash_count": raw.count("/"),
        "question_mark_count": raw.count("?"),
        "equal_count": raw.count("="),
        "ampersand_count": raw.count("&"),
        "at_symbol": 1 if "@" in raw else 0,
        "double_slash_redirect": 1 if raw.count("//") > 1 else 0,
        "subdomain_count": 0 if is_ip else _count_subdomains(host_no_port),
        "digit_count": _count_digits(raw),
        "special_char_count": _count_special_chars(raw),
        "suspicious_keyword_count": _suspicious_keyword_count(full_url_lower),
        "https": 1 if scheme == "https" else 0,
        "ip_host": is_ip,
        "is_shortener": 1 if host_no_port in URL_SHORTENERS else 0,
        "hostname_entropy": round(_entropy(host_no_port), 4),
        "has_port": has_port,
        "has_fragment": 1 if fragment else 0,
        "tld_in_path": 1 if _SCRIPT_EXT_RE.search(path.lower()) else 0,

        # --- View II: Multi-Suffix Topology & Positional Structure (8) ---
        "sld_length": 0 if is_ip else len(sld),
        "tld_length": 0 if is_ip else len(tld),
        "has_www": has_www_flag,
        "www_misplaced": www_misplaced_flag,
        "path_depth": len(path_segments),
        "longest_token_length": longest_tok,
        "tld_in_subdomain": 0 if is_ip else _has_tld_in_subdomain(sub, sld),
        "host_url_ratio": round(len(host_no_port) / url_len, 4),

        # --- View III: Brand-Domain Spoofing & Homoglyph Deception (8) ---
        "brand_spoof_score": brand_spoof,
        "sld_typosquat_score": sld_typo,
        "brand_in_subdomain": brand_sub,
        "host_keyword_count": _suspicious_keyword_count(host_no_port),
        "suspicious_tld": suspicious_tld_flag,
        "free_hosting_host": is_shared,
        "punycode_idn": punycode_flag,
        "digits_in_sld": 0 if is_ip else _count_digits(sld),

        # --- View IV: Information-Theoretic Divergence & Morphology (8) ---
        "path_entropy": round(_entropy(path), 4),
        "hostname_kl_divergence": _hostname_kl_divergence(host_no_port),
        "char_transition_rate": _char_transition_rate(host_no_port),
        "digit_ratio_host": round(host_digits / max(1, len(host_no_port)), 4),
        "vowel_ratio": _vowel_ratio(host_no_port),
        "max_consonant_run": _max_consonant_run(host_no_port),
        "uppercase_ratio": round(sum(1 for c in raw if c.isupper()) / url_len, 4),
        "percent_encoding_count": raw.count("%"),
    }

    return features


# Classical 24-feature subset (Baseline B0 for ablation & literature comparison)
BASELINE_24_COLUMNS: list[str] = [
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

# Full 48-feature multi-view schema used by PhishGuard-Stack
FEATURE_COLUMNS: list[str] = BASELINE_24_COLUMNS + [
    # View II (8)
    "sld_length",
    "tld_length",
    "has_www",
    "www_misplaced",
    "path_depth",
    "longest_token_length",
    "tld_in_subdomain",
    "host_url_ratio",
    # View III (8)
    "brand_spoof_score",
    "sld_typosquat_score",
    "brand_in_subdomain",
    "host_keyword_count",
    "suspicious_tld",
    "free_hosting_host",
    "punycode_idn",
    "digits_in_sld",
    # View IV (8)
    "path_entropy",
    "hostname_kl_divergence",
    "char_transition_rate",
    "digit_ratio_host",
    "vowel_ratio",
    "max_consonant_run",
    "uppercase_ratio",
    "percent_encoding_count",
]


def features_to_row(url: str) -> list[float]:
    """Return all 48 features as an ordered float vector matching FEATURE_COLUMNS."""
    feat = extract_features(url)
    return [float(feat[col]) for col in FEATURE_COLUMNS]


def extract_registrable_domain(url: str) -> str:
    """
    Extract canonical registrable root domain (eTLD+1) for strict domain-disjoint
    train/validation/test partitioning (preventing domain memorization leakage).
    """
    raw = url.strip()
    if "://" not in raw:
        raw = "http://" + raw
    try:
        parsed = urlparse(raw)
        host = (parsed.hostname or parsed.netloc or "").lower().rsplit(":", 1)[0].strip("[]")
    except Exception:
        return raw.lower()[:32]
    if not host:
        return raw.lower()[:32]
    if _is_ip_host(host):
        return host
    sub, sld, tld = split_registrable_domain(host)
    if _is_shared_hosting(host) and sub:
        # Group by tenant subdomain on multi-tenant hosting so distinct tenants stay distinct
        tenant = sub.split(".")[-1]
        return f"{tenant}.{sld}.{tld}" if tld else f"{tenant}.{sld}"
    return f"{sld}.{tld}" if tld else sld
