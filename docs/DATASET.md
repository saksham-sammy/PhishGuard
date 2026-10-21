# PhishGuard — Dataset Documentation

## 1. Primary Dataset Overview

PhishGuard is configured to train on the **PhiUSIIL Phishing URL Dataset** provided by the UCI Machine Learning Repository, as well as an integrated high-fidelity deterministic generator designed for offline development and reproducible seminars.

### UCI PhiUSIIL Phishing URL Dataset Reference
- **Repository Source:** [UCI Machine Learning Repository #967](https://archive.ics.uci.edu/dataset/967/phiusiil+phishing+url+dataset)
- **License:** Creative Commons Attribution 4.0 International (CC BY 4.0)
- **Published Year:** 2023
- **Record Count:** ~235,795 labelled instances
- **Target Label:** `label` (0 = Legitimate / Benign, 1 = Phishing / Malicious)

---

## 2. Feature Definitions & Extraction Schema

The feature extraction subsystem calculates 24 numerical and boolean indicators directly from raw URL strings:

| Index | Feature Key | Data Type | Description | Phishing Indicator Rationale |
|:-----:|:------------|:---------:|:------------|:-----------------------------|
| 1 | `url_length` | Integer | Total character count of full URL | Phishing URLs often include long obfuscated parameter chains. |
| 2 | `hostname_length` | Integer | Character count of network host (excluding port) | Adversaries frequently use lengthy subdomain prefixes. |
| 3 | `path_length` | Integer | Character count of the URI path component | Deep directory hierarchies mask fake landing pages. |
| 4 | `query_length` | Integer | Length of query string parameters | Heavy parameterization is common in credential harvesting schemes. |
| 5 | `dot_count` | Integer | Count of `.` characters in hostname | Indicates excessive subdomain nesting (e.g. `login.paypal.com.evil.com`). |
| 6 | `hyphen_count` | Integer | Count of `-` characters in hostname | Phishers use hyphens to simulate compound brand names. |
| 7 | `underscore_count` | Integer | Count of `_` characters across full URL | Legitimate domains rarely include underscores in FQDNs. |
| 8 | `slash_count` | Integer | Count of `/` characters in full URL | High slash count reflects complex nesting. |
| 9 | `question_mark_count` | Integer | Count of `?` characters in full URL | High occurrences indicate malformed or convoluted URLs. |
| 10 | `equal_count` | Integer | Count of `=` characters | Common in tracking and affiliate redirection. |
| 11 | `ampersand_count` | Integer | Count of `&` characters in query string | High count indicates multi-variable state transfers. |
| 12 | `at_symbol` | Binary (0/1) | Presence of `@` symbol | In RFC 3986, characters preceding `@` are treated as userinfo, redirecting the browser to the host following `@`. |
| 13 | `double_slash_redirect` | Binary (0/1) | Count of `//` after the initial protocol scheme | Used in path traversal and redirection bypass exploits. |
| 14 | `subdomain_count` | Integer | Estimated count of subdomain labels | Measures hierarchy depth beyond top-level and second-level domain. |
| 15 | `digit_count` | Integer | Count of numeric digits (0–9) | Phishers often generate random numeric IDs or use IP addresses. |
| 16 | `special_char_count` | Integer | Count of special characters outside alphanumeric, `.` and `-` | High density correlates with obfuscation techniques. |
| 17 | `suspicious_keyword_count` | Integer | Count of targeted credential terms (`login`, `verify`, `banking`, etc.) | Semantic indicator of credential lure. |
| 18 | `https` | Binary (0/1) | Whether scheme equals HTTPS | Historically, lack of HTTPS was indicative; now analyzed contextually. |
| 19 | `ip_host` | Binary (0/1) | Hostname is an IPv4 or bracketed IPv6 address | Legitimate public web applications almost universally employ DNS names. |
| 20 | `is_shortener` | Binary (0/1) | Match against known shortener hosts (`bit.ly`, `tinyurl.com`, etc.) | URL shorteners conceal actual destination domains. |
| 21 | `hostname_entropy` | Float | Shannon entropy ($-\sum p \log_2 p$) of hostname characters | Algorithmically generated domains (DGAs) exhibit high entropy. |
| 22 | `has_port` | Binary (0/1) | Explicit non-standard port specified | Legitimate sites rarely expose custom ports to end users. |
| 23 | `has_fragment` | Binary (0/1) | Presence of `#` anchor fragment | Used to hide client-side payload scripts. |
| 24 | `tld_in_path` | Binary (0/1) | Presence of `.php`, `.html`, `.asp` in file path | Common target endpoints in traditional phishing kits. |

---

## 3. High-Fidelity Synthetic Dataset Generator

To guarantee offline reproducibility during seminars and avoid mandatory external downloads, `training/generate_dataset.py` generates 30,000 realistic URL samples:

- **15,000 Legitimate URL Records:** Built from legitimate brand lexicons (`google`, `github`, `microsoft`, etc.), standard generic/ccTLDs, standard query interfaces, and conventional corporate subdomains.
- **15,000 Phishing URL Records:** Built by synthetically simulating documented cyberattack mechanisms:
  - Brand spoofing with hyphenation (`paypal-secure-update.xyz`)
  - Raw IPv4 and IPv6 hosts (`http://192.168.1.50/login.php`)
  - RFC 3986 `@` userinfo tricks (`http://chase.com@malicious-node.online`)
  - Known URL shortening patterns (`http://bit.ly/claim-funds`)
  - Deep subdomain trees (`https://apple.com.verify-billing.security-alert.top`)
  - High-entropy algorithmic hostnames simulating Domain Generation Algorithms (DGAs).

All synthetic datasets are partitioned with a fixed random seed (`seed=42`) using an 80/20 train/test split.
