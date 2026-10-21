# PhishGuard — Technical Viva & Review Q&A Preparation

This guide compiles essential conceptual, architectural, and mathematical questions frequently asked by seminar evaluators, technical guides, and external examiners.

---

## 1. Core Cybersecurity & Design Decisions

### Q1: Why do we extract features from the URL string without fetching the webpage?
**Answer:**
1. **Safety & Zero Attack Surface:** Fetching suspect URLs can trigger drive-by malware downloads, zero-day browser exploits, or malicious web scripts on client machines.
2. **Evasion Avoidance:** Attackers deploy bot detection, geo-fencing, and user-agent fingerprinting. When an automated scanner fetches the page, the adversary serves an innocuous page (cloaking) while serving malicious forms to real users.
3. **Low Latency & Operational Speed:** Sub-millisecond string parsing enables real-time browser extension screening without slowing down user navigation.
4. **Bandwidth Efficiency:** No network requests, TLS handshakes, or asset downloads are required.

### Q2: What are the main limitations of URL-only detection?
**Answer:**
- **Compromised Reputable Hosts:** If an attacker hosts a credential harvesting form inside Google Forms, OneDrive, or compromised legitimate WordPress sites, the URL domain is authentic, so URL lexical features may fail to detect the threat.
- **Obfuscated / Shortened URLs:** Obfuscated shorteners hide the target domain structure until expanded.
- **Novel Lexical Patterns:** Adversaries can register clean-looking domains (e.g. `customer-portal-login.com`) that do not violate basic heuristic checks without historical reputation data.

---

## 2. Feature Engineering & Mathematics

### Q3: What is Shannon Entropy, and how does it help detect phishing domains?
**Answer:**
Shannon Entropy measures the average information or unpredictability of characters in a string:
$$H(X) = -\sum_{i=1}^{n} P(x_i) \log_2 P(x_i)$$
Legitimate corporate brand names usually conform to readable human language patterns, yielding moderate entropy. In contrast, automated Domain Generation Algorithms (DGAs) and fast-flux networks generate randomized alphanumeric strings (e.g. `a8f93kl90x.biz`), which exhibit significantly higher Shannon entropy.

### Q4: Why is the `@` symbol considered an attack indicator in URLs?
**Answer:**
Under RFC 3986, characters preceding the `@` symbol represent user authentication credentials (`username:password@hostname`), while the browser actually navigates to the domain **after** the `@`. Phishers exploit this syntax confusion:
`http://www.bankofamerica.com@malicious-phishing-host.xyz/login`
The user perceives "bankofamerica.com", but the browser connects to `malicious-phishing-host.xyz`.

---

## 3. Machine Learning Methodology

### Q5: Why did you compare Logistic Regression and Random Forest?
**Answer:**
- **Logistic Regression** serves as an interpretable linear baseline. Combined with standard scaling, it provides calibrated probability outputs and executes in sub-millisecond time.
- **Random Forest** is a non-linear ensemble of decision trees. It natively models non-linear interactions between features (e.g., high hyphen count combined with lack of HTTPS) without requiring explicit polynomial feature expansion.

### Q6: Why prioritize the F1-score over raw accuracy?
**Answer:**
In real-world cybersecurity, URL datasets frequently exhibit extreme class imbalance (e.g. 99% benign vs. 1% malicious). A naive model predicting "Legitimate" for every input would achieve 99% accuracy while having 0% recall on actual attacks. F1-score harmonic mean balances Precision (preventing false alarms on benign sites) and Recall (catching true phishing attacks):
$$\text{F1} = 2 \cdot \frac{\text{Precision} \cdot \text{Recall}}{\text{Precision} + \text{Recall}}$$

### Q7: Why did your synthetic test split achieve 1.0000 F1-score?
**Answer:**
The synthetic dataset generator was built using deterministic rules representing distinct structural categories (IP addresses, specific suspicious keywords, shortener domains, hyphenated brand lures). Because these feature combinations were cleanly separated, standard classifiers can separate the hyperplanes with zero training error. In our seminar report, we explicitly state that this validates pipeline correctness and serialization integrity, but real-world deployment requires training on broad, in-the-wild corpora like PhiUSIIL.

---

## 4. Software Architecture & Deployment

### Q8: How is state managed between the React frontend and FastAPI backend?
**Answer:**
Communication is completely stateless via REST JSON over HTTP.
- The React application communicates with FastAPI via a Vite reverse proxy configured in `vite.config.ts`, eliminating Cross-Origin Resource Sharing (CORS) complications during local development.
- SQLite is queried using parameterized SQL queries to prevent SQL injection vulnerabilities.
- URLs are truncated and stripped of query strings before database insertion to prevent storage of sensitive tokens or PII.

### Q9: What happens if the trained model file is deleted or corrupted?
**Answer:**
FastAPI catches the `ModelNotReadyError` during the lifespan check and safely returns an HTTP `503 Service Unavailable` with a structured JSON error explaining that the model artifact is missing, rather than crashing or returning an unhandled stack trace.
