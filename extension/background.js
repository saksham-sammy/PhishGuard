// PhishGuard Extension Service Worker (Manifest V3)
// Intercepts dangerous URLs before navigation and synchronizes audit history

const API_BASE = "http://localhost:8000/api";

// Session bypass cache for URLs the user explicitly permitted
const bypassedUrls = new Set();

const TRUSTED_DOMAINS = [
  "google.com", "google.co.in", "google.co.uk", "google.ca", "google.de", "google.fr",
  "google.com.au", "google.co.jp", "bing.com", "duckduckgo.com", "yahoo.com",
  "youtube.com", "wikipedia.org", "github.com", "gitlab.com", "microsoft.com",
  "apple.com", "amazon.com", "amazon.in", "linkedin.com", "reddit.com",
  "twitter.com", "x.com", "instagram.com", "facebook.com", "whatsapp.com",
  "overleaf.com", "ieee.org", "arxiv.org", "springer.com", "sciencedirect.com",
  "stackoverflow.com", "stackexchange.com", "medium.com", "openai.com", "chatgpt.com"
];

function isTrustedDomain(url) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    for (const d of TRUSTED_DOMAINS) {
      if (host === d || host.endsWith("." + d)) {
        return true;
      }
    }
  } catch (e) {}
  return false;
}

// Local fast heuristic analyzer (runs in < 0.1ms)
function localFastHeuristic(url) {
  if (isTrustedDomain(url)) {
    return {
      predicted_class: "legitimate",
      risk_category: "low",
      probability: 0.001,
      warnings: [],
      explanation: "Verified trusted domain authority."
    };
  }
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const full = url.toLowerCase();

    let score = 0.0;
    const reasons = [];

    // Check raw numerical IP host
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(host)) {
      score += 0.85;
      reasons.push("Host address is a raw numerical IP instead of a verified domain name");
    }

    // Check @ symbol redirect trick (RFC 3986)
    if (url.includes("@")) {
      score += 0.90;
      reasons.push("Deceptive '@' userinfo credential redirect detected");
    }

    // Check credential lure keywords
    const keywords = ["login", "verify", "secure", "banking", "update", "paypal", "free-prize", "account-alert"];
    const matched = keywords.filter(k => full.includes(k));
    if (matched.length >= 2) {
      score += 0.45;
      reasons.push(`Contains multiple sensitive lure keywords (${matched.join(", ")})`);
    } else if (matched.length === 1 && !isTrustedDomain(url)) {
      score += 0.20;
    }

    // Check excessive hyphens in host
    const hyphens = (host.match(/-/g) || []).length;
    if (hyphens >= 2) {
      score += 0.35;
      reasons.push("Suspicious hyphenation in domain name (common typosquatting technique)");
    }

    // Check URL shorteners
    const shorteners = ["bit.ly", "tinyurl.com", "t.co", "is.gd", "rb.gy"];
    if (shorteners.includes(host)) {
      score += 0.40;
      reasons.push("Obfuscated shortener link obscuring destination");
    }

    // Check HTTP unencrypted
    if (parsed.protocol === "http:") {
      score += 0.20;
      reasons.push("Unencrypted HTTP protocol; transmits data in plaintext");
    }

    // Check deep nested subdomains
    const subdomains = host.split(".").length - 2;
    if (subdomains >= 3) {
      score += 0.35;
      reasons.push(`Suspicious deep subdomain nesting (${subdomains} levels)`);
    }

    const isPhishing = score >= 0.55;
    const risk = score >= 0.70 ? "high" : score >= 0.40 ? "medium" : "low";

    return {
      predicted_class: isPhishing ? "phishing" : "legitimate",
      risk_category: risk,
      probability: Math.min(Math.max(score, 0.01), 1.0),
      warnings: reasons,
      explanation: isPhishing
        ? "Classified as suspicious based on structural anomalies and brand lure indicators."
        : "Standard lexical characteristics detected."
    };
  } catch (e) {
    return {
      predicted_class: "legitimate",
      risk_category: "low",
      probability: 0.0,
      warnings: [],
      explanation: "Unable to parse URL structure."
    };
  }
}

// Synchronize scan with backend API for persistent SQLite audit log
async function syncScanWithBackend(url) {
  try {
    const res = await fetch(`${API_BASE}/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url })
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (e) {
    // Backend offline or sleeping: fallback to client heuristic
  }
  return localFastHeuristic(url);
}

// Broadcast scan event to any open PhishGuard dashboard tabs
function broadcastToWebsiteTabs(assessment, url) {
  chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs) {
      if (tab.url && (tab.url.includes("localhost:5173") || tab.url.includes("127.0.0.1:5173") || tab.url.includes("vercel.app"))) {
        chrome.tabs.sendMessage(tab.id, {
          action: "PHISHGUARD_NEW_SCAN",
          url,
          assessment
        }).catch(() => {});
      }
    }
  });
}

// ── Intercept BEFORE Navigation Begins ─────────────────────────────────────
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  // Only inspect top-level frame navigation
  if (details.frameId !== 0) return;

  const url = details.url;
  if (!url) return;

  // Skip browser internals and local dashboard
  if (
    url.startsWith("chrome://") ||
    url.startsWith("chrome-extension://") ||
    url.startsWith("edge://") ||
    url.startsWith("about:") ||
    url.includes("localhost:5173") ||
    url.includes("127.0.0.1:5173")
  ) {
    return;
  }

  // Check if user already chose to bypass this specific URL in this session
  if (bypassedUrls.has(url)) {
    chrome.action.setBadgeText({ tabId: details.tabId, text: "PASS" });
    chrome.action.setBadgeBackgroundColor({ tabId: details.tabId, color: "#f59e0b" });
    return;
  }

  // Fast heuristic preview
  const fastPreview = localFastHeuristic(url);

  // If obviously high-risk / phishing, block IMMEDIATELY before navigation proceeds!
  if (fastPreview.predicted_class === "phishing" && fastPreview.risk_category === "high") {
    // Intercept immediately: redirect tab to security interstitial
    const blockUrl = chrome.runtime.getURL(
      `blocked.html?url=${encodeURIComponent(url)}&risk=${encodeURIComponent(fastPreview.risk_category)}&reasons=${encodeURIComponent(JSON.stringify(fastPreview.warnings))}&score=${encodeURIComponent(fastPreview.probability)}`
    );
    chrome.tabs.update(details.tabId, { url: blockUrl });

    // Update extension badge
    chrome.action.setBadgeText({ tabId: details.tabId, text: "BLOCKED" });
    chrome.action.setBadgeBackgroundColor({ tabId: details.tabId, color: "#e11d48" });

    // Sync to backend history & broadcast to website
    syncScanWithBackend(url).then(assessment => {
      broadcastToWebsiteTabs(assessment, url);
    });
    return;
  }

  // For non-obviously malicious URLs, perform standard scan and audit sync
  syncScanWithBackend(url).then(assessment => {
    broadcastToWebsiteTabs(assessment, url);

    if (assessment.predicted_class === "phishing" && assessment.risk_category === "high") {
      // Backend confirmed high-risk phishing: redirect to block screen
      const blockUrl = chrome.runtime.getURL(
        `blocked.html?url=${encodeURIComponent(url)}&risk=${encodeURIComponent(assessment.risk_category)}&reasons=${encodeURIComponent(JSON.stringify(assessment.warnings || []))}&score=${encodeURIComponent(assessment.probability || 0)}`
      );
      chrome.tabs.update(details.tabId, { url: blockUrl });
      chrome.action.setBadgeText({ tabId: details.tabId, text: "BLOCKED" });
      chrome.action.setBadgeBackgroundColor({ tabId: details.tabId, color: "#e11d48" });
    } else if (assessment.risk_category === "medium") {
      chrome.action.setBadgeText({ tabId: details.tabId, text: "WARN" });
      chrome.action.setBadgeBackgroundColor({ tabId: details.tabId, color: "#f59e0b" });
    } else {
      chrome.action.setBadgeText({ tabId: details.tabId, text: "OK" });
      chrome.action.setBadgeBackgroundColor({ tabId: details.tabId, color: "#10b981" });
    }
  });
});

// ── Extension Messages & Popup Handlers ────────────────────────────────────
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "BYPASS_URL" && request.url) {
    bypassedUrls.add(request.url);
    sendResponse({ success: true });
    return true;
  }

  if (request.action === "SCAN_CURRENT") {
    syncScanWithBackend(request.url).then(data => {
      sendResponse({ success: true, data });
    });
    return true; // Keep message channel open for async response
  }
});
