# PhishGuard — Browser Extension (Manifest V3)

A Chromium browser extension providing **pre-navigation interception and real-time threat blocking**.

---

## 1. How It Works (Pre-Navigation Defense)

1. **Pre-Navigation Interception:** The extension hooks into `chrome.webNavigation.onBeforeNavigate` before network requests or TCP handshakes are established.
2. **Instant Threat Analysis:** Fast deterministic heuristics and ML screening evaluate the destination address in sub-millisecond execution.
3. **Full-Page Security Interstitial (`blocked.html`):** If a high-risk phishing link is detected (such as raw IP hosts, `@` userinfo tricks, or credential lures), the extension **immediately aborts navigation** and redirects the tab to a full-screen PhishGuard Security Interstitial screen *before the browser connects to the malicious server*.
4. **Real-Time History Sync:** Every screened site (Safe, Moderate, High Risk) is logged and synchronized live to the PhishGuard web dashboard's **Browsing & Scan History** tab (`http://localhost:5173` or your Vercel deployment) across all active tabs.

---

## 2. Installation in Google Chrome / Brave / Edge

1. Open your browser and navigate to:
   - **Chrome / Brave:** `chrome://extensions`
   - **Edge:** `edge://extensions`
2. Turn on **Developer mode** (toggle in the top-right corner).
3. Click **Load unpacked** (top-left button).
4. Select the directory:
   ```
   C:\Users\admin\Desktop\VS Codes\Projects\Phishing Detection\phishguard\extension
   ```
5. If you already had it loaded, click the **Reload icon (↻)** on the PhishGuard extension card.

---

## 3. Testing Pre-Navigation Blocking

Try visiting any phishing or deceptive URL in your browser:
* `http://paypal-verification-alert.com/login.php`
* `http://192.168.1.1/login.php`
* `http://www.paypal.com@verify-account-security-alert.xyz/update`

**Result:**
* You are **not** taken to the phishing page.
* You are immediately redirected to the **PhishGuard Security Interstitial** with reasons explained and a 1-click **"← Back to Safety"** button.
* If you keep the PhishGuard web dashboard open in another tab, the **Browsing & Scan History** tab updates automatically in real time!
