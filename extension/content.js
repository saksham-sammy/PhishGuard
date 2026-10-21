// PhishGuard Humanized Security Alert Banner (Manifest V3)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "PHISHGUARD_WARN") {
    injectPhishGuardBanner(message.assessment, message.url);
  }
});

function injectPhishGuardBanner(assessment, url) {
  if (document.getElementById("phishguard-notice")) return;

  const banner = document.createElement("div");
  banner.id = "phishguard-notice";
  banner.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    max-width: 420px;
    width: calc(100vw - 40px);
    background: #18181b;
    color: #fafafa;
    border: 1px solid #7f1d1d;
    border-radius: 12px;
    padding: 18px;
    z-index: 2147483647;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
    animation: phishguard-slide-in 0.3s ease-out;
  `;

  const warnings = (assessment.warnings || [])
    .map(w => `<li style="margin-bottom: 4px; color: #fca5a5;">${escapeHtml(w)}</li>`)
    .join("");

  banner.innerHTML = `
    <style>
      @keyframes phishguard-slide-in {
        from { transform: translateY(-20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    </style>
    <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 10px;">
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 20px;">⚠️</span>
        <h3 style="margin: 0; font-size: 15px; font-weight: 600; color: #ef4444;">Suspicious Site Detected</h3>
      </div>
      <button id="phishguard-close" style="background: none; border: none; color: #71717a; font-size: 18px; cursor: pointer; padding: 0 4px; line-height: 1;">×</button>
    </div>

    <p style="margin: 0 0 10px 0; font-size: 13px; color: #a1a1aa; line-height: 1.4;">
      PhishGuard noticed deceptive patterns on this link. If this is an unexpected login page, please verify carefully before entering passwords.
    </p>

    ${warnings ? `<ul style="margin: 0 0 14px 0; padding-left: 20px; font-size: 12px;">${warnings}</ul>` : ""}

    <div style="display: flex; gap: 8px; justify-content: flex-end;">
      <button id="phishguard-dismiss" style="background: #27272a; border: 1px solid #3f3f46; color: #d4d4d8; padding: 6px 12px; border-radius: 6px; font-size: 12px; cursor: pointer;">
        I trust this site
      </button>
      <button id="phishguard-leave" style="background: #dc2626; border: none; color: white; padding: 6px 14px; border-radius: 6px; font-size: 12px; font-weight: 500; cursor: pointer;">
        Leave site
      </button>
    </div>
  `;

  document.body.appendChild(banner);

  document.getElementById("phishguard-close").addEventListener("click", () => banner.remove());
  document.getElementById("phishguard-dismiss").addEventListener("click", () => banner.remove());
  document.getElementById("phishguard-leave").addEventListener("click", () => {
    window.location.href = "https://www.google.com";
  });
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, m => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[m]));
}
