# PhishGuard-Stack — Dataset & 48-Feature Schema Documentation

## 1. Real-World Benchmark Corpora

PhishGuard-Stack eliminates synthetic URL templates and evaluates exclusively on real-world, peer-reviewed and live threat-intelligence corpora:

1. **Primary Benchmark — Hannousse & Yahiouche (2021):**
   - **Source:** *Engineering Applications of Artificial Intelligence*, vol. 104, 104347 (Mendeley DOI: `10.17632/c2gw7fy2j4.3`).
   - **Size:** **11,429 deduplicated URLs** (`5,715` legitimate + `5,714` phishing) spanning **7,188 unique registrable root domains**.
   - **Partitioning:** `StratifiedGroupKFold` grouped by public-suffix registrable root (`eTLD+1`) -> **9,143 training URLs** (`5,752` domains) and **2,286 test URLs** (`1,436` domains), with **zero domain overlap**.
2. **Cross-Corpus Out-of-Distribution (OOD) Benchmark — Sahingoz et al. (2019) Ebbu2017:**
   - **Size:** **10,000 unseen URLs** (`5,000` legitimate + `5,000` phishing) evaluated strictly zero-shot without retraining.
3. **Live 2026 Zero-Day Threat Feed — OpenPhish:**
   - **Size:** **300 active zero-day phishing URLs** (`53.33%` HTTPS) collected from the live OpenPhish feed.

---

## 2. 48-Dimensional Multi-View Fetch-Free Feature Schema

- **View I — Classical Lexical, Count & Protocol Primitives (24 features):**
  `url_length`, `hostname_length`, `path_length`, `query_length`, `dot_count`, `hyphen_count`, `underscore_count`, `slash_count`, `question_mark_count`, `equal_count`, `ampersand_count`, `at_symbol`, `double_slash_redirect`, `subdomain_count`, `digit_count`, `special_char_count`, `suspicious_keyword_count`, `https`, `ip_host`, `is_shortener`, `hostname_entropy`, `has_port`, `has_fragment`, `tld_in_path`.
- **View II — Public-Suffix-Aware Topology & Ratios (8 features):**
  `sld_length`, `tld_length`, `has_www`, `www_misplaced`, `path_depth`, `longest_token_length`, `tld_in_subdomain`, `host_url_ratio`.
- **View III — Homoglyph Brand-Domain Spoofing & Host/TLD Abuse (8 features):**
  `brand_spoof_score` ($\Delta_{\text{brand}}$), `sld_typosquat_score` ($\tau_{\text{typo}}$), `brand_in_subdomain`, `host_keyword_count`, `suspicious_tld`, `free_hosting_host`, `punycode_idn`, `digits_in_sld`.
- **View IV — Information-Theoretic Divergence & Character Morphology (8 features):**
  `path_entropy`, `hostname_kl_divergence` ($D_{\text{KL}}$), `char_transition_rate` ($\rho_{\text{switch}}$), `digit_ratio_host`, `vowel_ratio`, `max_consonant_run`, `uppercase_ratio`, `percent_encoding_count`.
