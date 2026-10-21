# PhishGuard — Technical Seminar Demonstration Script (Review 2)

**Project Title:** PhishGuard — AI-Based Phishing URL Detection System Using Machine Learning  
**Presenters:** Kedar Kapse, Ritesh Kumar, Saksham Sharma, Saurabh Singh  
**Department:** Computer Science Engineering (AI & ML), School of Engineering & Technology, Pimpri Chinchwad University, Pune  

---

## 1. Seminar Presentation Agenda (5–7 Minutes)

1. **Problem Statement & Motivation (1 min):** Why traditional static blacklists fail against zero-day campaigns, ephemeral domains, and fast-flux hosting.
2. **Architecture & Security Rationale (1.5 min):** Explain the fetch-free design (why we do not visit or trigger the suspect web server).
3. **Machine Learning Pipeline (1.5 min):** Walk through the 24 extracted lexical/syntactic features, dataset composition, and model training comparison.
4. **Live System Demonstration (2 min):**
   - Real-time screening of an authentic URL (`https://www.google.com`).
   - Real-time screening of an IP-based deceptive URL (`http://192.168.1.1/login.php`).
   - Real-time screening of an RFC 3986 userinfo attack URL (`http://paypal.com@verify-account-security.xyz`).
   - Viewing live training metrics and confusion matrix in the Model Dashboard.
   - Inspecting the sanitized scan history audit log.
5. **Q&A & Viva Readiness (1 min):** Acknowledge realistic operational limitations and explain future work.

---

## 2. Step-by-Step Live Demo Execution

### Step 1: Show the Services Running
Open a browser and navigate to:
- **Frontend Dashboard:** `http://localhost:5173`
- Point out the **API Online** indicator pill in the top-right of the navigation bar, proving that the React application is actively connected to the FastAPI backend.

### Step 2: Test 1 — Legitimate URL
1. In the URL input field, enter or click:
   ```
   https://www.google.com
   ```
2. Click **Scan URL**.
3. Point out:
   - **Verdict:** `Potentially Legitimate` (Green badge).
   - **Risk Category:** `Low Risk`.
   - **Probability Score:** `0.00%`.
   - **Feature Breakdown:** Shows HTTPS enabled, 0 suspicious keywords, no raw IP, low entropy.

### Step 3: Test 2 — Malicious IP Address Hosting
1. Enter or click:
   ```
   http://192.168.1.1/login.php
   ```
2. Click **Scan URL**.
3. Point out:
   - **Verdict:** `Potentially Phishing` (Red badge).
   - **Risk Category:** `High Risk`.
   - **Probability Score:** `~99.9%`.
   - **Warning Indicators:**
     - *"Hostname is a raw IP address, which is unusual for legitimate sites."*
     - *"URL uses HTTP (not HTTPS); data is not encrypted in transit."*
   - Emphasize that **no network request was sent to 192.168.1.1**, preventing malicious payload execution or reconnaissance alerts.

### Step 4: Test 3 — Deceptive Subdomain / Shortener
1. Enter:
   ```
   http://bit.ly/claim-free-prize-bonus
   ```
2. Click **Scan URL**.
3. Point out the detection of the known URL shortener service (`bit.ly`) and presence of suspicious keywords (`free`, `prize`, `bonus`).

### Step 5: Walk Through the Model Dashboard
1. Click the **Model Dashboard** tab in the navigation bar.
2. Demonstrate that metrics are **not hardcoded mockups**:
   - Total training/testing split count.
   - Accuracy, Precision, Recall, and F1-Score ($1.0000$ on synthetic baseline).
   - Interactive Confusion Matrix showing true positives, true negatives, and false classification counts.
   - The selected model architecture (Logistic Regression / Random Forest).

### Step 6: Walk Through Scan History & Privacy
1. Click the **History** tab.
2. Show the persistent SQLite audit table.
3. Highlight that query strings are stripped from stored URLs to prevent credential leakage.
4. Click **Clear** to demonstrate the GDPR-compliant data purge capability.

---

## 3. Key Talking Points for Guide Consultation

- *"Our primary design objective was building a safe, client-side fetch-free screening mechanism. Most security scanners attempt to render the remote page, which risks sandbox evasion, payload triggering, and IP exposure."*
- *"We trained both Logistic Regression and Random Forest models with stratified holdout validation. For production deployment, this model serves as a lightweight Tier-1 screening filter prior to expensive DOM rendering or visual logo inspection."*
