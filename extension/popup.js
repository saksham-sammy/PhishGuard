// PhishGuard Extension Popup Controller
const API_BASE = "http://localhost:8000/api";

document.addEventListener("DOMContentLoaded", async () => {
  const currentUrlEl = document.getElementById("current-url");
  const verdictBox = document.getElementById("verdict-box");
  const verdictIcon = document.getElementById("verdict-icon");
  const verdictTitle = document.getElementById("verdict-title");
  const verdictScore = document.getElementById("verdict-score");
  const warningsContainer = document.getElementById("warnings-container");
  const shieldToggle = document.getElementById("shield-toggle");
  const apiStatus = document.getElementById("api-status");
  const threatsCountEl = document.getElementById("threats-blocked");
  const recheckBtn = document.getElementById("btn-recheck");
  const manualForm = document.getElementById("manual-scan-form");
  const manualInput = document.getElementById("manual-url");

  // Check backend connectivity
  try {
    const health = await fetch(`${API_BASE}/health`);
    if (health.ok) {
      apiStatus.querySelector(".status-label").textContent = "Online";
      apiStatus.classList.remove("offline");
    } else {
      throw new Error();
    }
  } catch (e) {
    apiStatus.querySelector(".status-label").textContent = "Offline (Local Engine)";
    apiStatus.classList.add("offline");
  }

  // Load shield preference
  const { autoProtect = true, threatHistory = [] } = await chrome.storage.local.get(["autoProtect", "threatHistory"]);
  shieldToggle.checked = autoProtect;
  threatsCountEl.textContent = `${threatHistory.length} threats screened`;

  shieldToggle.addEventListener("change", async (e) => {
    await chrome.storage.local.set({ autoProtect: e.target.checked });
  });

  // Scan current active tab
  async function inspectActiveTab() {
    verdictBox.className = "verdict-banner";
    verdictIcon.textContent = "⏳";
    verdictTitle.textContent = "Analyzing Tab...";
    verdictScore.textContent = "Extracting URL features...";
    warningsContainer.innerHTML = "";

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.url) {
        currentUrlEl.textContent = "No active web page";
        verdictTitle.textContent = "Inactive Tab";
        verdictScore.textContent = "";
        return;
      }

      currentUrlEl.textContent = tab.url;

      // Ask background script to scan
      chrome.runtime.sendMessage({ action: "SCAN_CURRENT", url: tab.url }, (res) => {
        if (res && res.data) {
          renderVerdict(res.data);
        } else {
          verdictTitle.textContent = "Scan Unavailable";
          verdictScore.textContent = "Check API status";
        }
      });
    } catch (err) {
      verdictTitle.textContent = "Error";
      verdictScore.textContent = err.message;
    }
  }

  function renderVerdict(data) {
    const isPhishing = data.predicted_class === "phishing";
    verdictBox.className = `verdict-banner ${isPhishing ? "phishing" : "legitimate"}`;
    verdictIcon.textContent = isPhishing ? "⚠️" : "🛡️";
    verdictTitle.textContent = isPhishing ? "Potentially Phishing" : "Potentially Legitimate";

    const scorePct = data.probability !== null && data.probability !== undefined
      ? `${(data.probability * 100).toFixed(1)}%`
      : "N/A";
    verdictScore.textContent = `Threat Likelihood: ${scorePct} (${(data.risk_category || "low").toUpperCase()} RISK)`;

    if (data.warnings && data.warnings.length > 0) {
      warningsContainer.innerHTML = data.warnings.map(w => `<div>• ${escapeHtml(w)}</div>`).join("");
    } else {
      warningsContainer.innerHTML = "";
    }
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, m => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[m]));
  }

  recheckBtn.addEventListener("click", inspectActiveTab);

  manualForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const url = manualInput.value.trim();
    if (!url) return;
    currentUrlEl.textContent = url;
    chrome.runtime.sendMessage({ action: "SCAN_CURRENT", url }, (res) => {
      if (res && res.data) renderVerdict(res.data);
    });
  });

  inspectActiveTab();
});
