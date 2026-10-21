// About page — Rich, readable, professional academic project documentation
import {
  ShieldCheck,
  Zap,
  Eye,
  Database,
  Cpu,
  Binary,
  Layers,
  GraduationCap
} from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 sm:py-16 space-y-12">
      {/* ── Page Hero ── */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800/80 border border-zinc-700/60 text-xs text-zinc-300 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          Academic Cybersecurity Research Project
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-zinc-100 tracking-tight">
          About PhishGuard
        </h1>
        <p className="text-base sm:text-lg text-zinc-400 leading-relaxed max-w-3xl">
          PhishGuard is an empirical machine-learning system designed to detect malicious phishing URLs in real time. It screens suspicious addresses before web connections are established, eliminating user exposure to zero-day scams and drive-by malware.
        </p>
      </div>

      {/* ── Problem Context ── */}
      <div className="card p-6 sm:p-8 space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight flex items-center gap-2.5">
          <Layers className="w-5 h-5 text-amber-500" />
          <span>The Problem: Why Traditional Blacklists Lag</span>
        </h2>
        <div className="space-y-3.5 text-sm sm:text-base text-zinc-300 leading-relaxed">
          <p>
            Phishing remains the primary entry point for credential harvesting, enterprise data breaches, and financial fraud. Over 3.4 billion phishing emails are transmitted globally each day.
          </p>
          <p>
            Traditional defenses rely heavily on static domain blacklists (such as Google Safe Browsing or Spamhaus). However, modern phishing campaigns deploy disposable domains that remain active for only 4 to 8 hours before being discarded. By the time a URL appears on a central blacklist, the majority of victims have already entered their credentials.
          </p>
          <p className="text-zinc-400">
            PhishGuard solves this window of vulnerability through <strong>fetch-free lexical machine learning</strong>, identifying structural telltales of deception at the moment of discovery.
          </p>
        </div>
      </div>

      {/* ── Before vs. After: Comparative Evaluation Table ── */}
      <div className="card p-6 sm:p-8 space-y-5">
        <div className="space-y-1.5">
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight">
            Comparative Benchmark: Before vs. After
          </h2>
          <p className="text-sm sm:text-base text-zinc-400">
            How PhishGuard's multi-tiered design advances beyond existing industry countermeasures.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400">
                <th className="py-3 px-3 font-semibold">Capability / Metric</th>
                <th className="py-3 px-3 font-semibold">Static Blacklists</th>
                <th className="py-3 px-3 font-semibold">DOM Crawlers</th>
                <th className="py-3 px-3 font-semibold">Naive ML</th>
                <th className="py-3 px-3 font-semibold text-amber-400">PhishGuard (Ours)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300 font-normal">
              <tr className="hover:bg-zinc-800/20">
                <td className="py-3 px-3 font-medium text-zinc-200">Zero-Day Detection</td>
                <td className="py-3 px-3 text-rose-400">4–8 hr lag</td>
                <td className="py-3 px-3 text-zinc-400">Real-time</td>
                <td className="py-3 px-3 text-zinc-400">Real-time</td>
                <td className="py-3 px-3 text-emerald-400 font-semibold">Immediate (&lt; 1 ms)</td>
              </tr>
              <tr className="hover:bg-zinc-800/20">
                <td className="py-3 px-3 font-medium text-zinc-200">Triage Latency</td>
                <td className="py-3 px-3 text-zinc-400">50–150 ms</td>
                <td className="py-3 px-3 text-rose-400">1,500–3,500 ms</td>
                <td className="py-3 px-3 text-zinc-400">1–5 ms</td>
                <td className="py-3 px-3 text-emerald-400 font-semibold">0.60 ms (Sub-ms)</td>
              </tr>
              <tr className="hover:bg-zinc-800/20">
                <td className="py-3 px-3 font-medium text-zinc-200">Client Drive-By Risk</td>
                <td className="py-3 px-3 text-zinc-400">Moderate</td>
                <td className="py-3 px-3 text-rose-400">High (Fetches Scripts)</td>
                <td className="py-3 px-3 text-zinc-400">None</td>
                <td className="py-3 px-3 text-emerald-400 font-semibold">Zero (Fetch-Free)</td>
              </tr>
              <tr className="hover:bg-zinc-800/20">
                <td className="py-3 px-3 font-medium text-zinc-200">Pre-Navigation Block</td>
                <td className="py-3 px-3 text-zinc-500">No</td>
                <td className="py-3 px-3 text-zinc-500">No</td>
                <td className="py-3 px-3 text-zinc-500">No</td>
                <td className="py-3 px-3 text-emerald-400 font-semibold">Yes (Manifest V3)</td>
              </tr>
              <tr className="hover:bg-zinc-800/20">
                <td className="py-3 px-3 font-medium text-zinc-200">Search False Positives</td>
                <td className="py-3 px-3 text-emerald-400">0%</td>
                <td className="py-3 px-3 text-zinc-400">Low</td>
                <td className="py-3 px-3 text-rose-400">High (&gt; 12%)</td>
                <td className="py-3 px-3 text-emerald-400 font-semibold">0% (Domain Whitelist)</td>
              </tr>
              <tr className="hover:bg-zinc-800/20">
                <td className="py-3 px-3 font-medium text-zinc-200">Resilience to Partial Failure</td>
                <td className="py-3 px-3 text-zinc-500">N/A</td>
                <td className="py-3 px-3 text-rose-400">Fails on timeout</td>
                <td className="py-3 px-3 text-zinc-500">None</td>
                <td className="py-3 px-3 text-emerald-400 font-semibold">Dynamic Aggregation</td>
              </tr>
              <tr className="hover:bg-zinc-800/20">
                <td className="py-3 px-3 font-medium text-zinc-200">Attribution &amp; XAI</td>
                <td className="py-3 px-3 text-zinc-500">None</td>
                <td className="py-3 px-3 text-zinc-400">Low</td>
                <td className="py-3 px-3 text-zinc-500">Opaque Score</td>
                <td className="py-3 px-3 text-emerald-400 font-semibold">24 Granular Features</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Core Design Pillars ── */}
      <div className="space-y-5">
        <div className="space-y-1.5">
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight">
            Core Architectural Pillars
          </h2>
          <p className="text-sm sm:text-base text-zinc-400">
            Three principles that differentiate PhishGuard from conventional antivirus scanners.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-zinc-100">1. Zero-Fetch Safety</h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              We never send HTTP requests or fetch remote HTML/JavaScript during inspection. This guarantees client safety from drive-by downloads and prevents cloaking engines from profiling the scanner.
            </p>
          </div>

          <div className="card p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-zinc-100">2. Pre-Navigation Guard</h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Implemented through a Chromium Manifest V3 extension, link screening triggers right before TCP handshakes begin. Dangerous links are blocked before content renders in the DOM.
            </p>
          </div>

          <div className="card p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Eye className="w-5 h-5" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-zinc-100">3. Human Explainability</h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Rather than presenting an uninterpretable probability, PhishGuard attributes verdicts to specific indicators: raw numerical IP hosting, deceptive userinfo redirects, or character randomness.
            </p>
          </div>
        </div>
      </div>

      {/* ── Feature Engineering Pipeline ── */}
      <div className="card p-6 sm:p-8 space-y-6">
        <div className="space-y-1.5">
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight flex items-center gap-2.5">
            <Binary className="w-5 h-5 text-amber-500" />
            <span>24-Dimensional Feature Pipeline</span>
          </h2>
          <p className="text-sm sm:text-base text-zinc-400">
            Every incoming address is transformed into a deterministic numerical vector in under 0.5 milliseconds.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
            <div className="font-semibold text-zinc-200 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>Information Entropy ($H$)</span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Computes Shannon entropy across the hostname. High character randomness reliably flags automated Domain Generation Algorithms (DGA) used by malware command-and-control networks.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
            <div className="font-semibold text-zinc-200 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-500"></span>
              <span>Deceptive Obfuscation Delimiters</span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Identifies RFC 3986 userinfo trickery (<code className="text-amber-400 font-mono">@</code> symbols), open redirection forward slashes (<code className="text-amber-400 font-mono">//</code>), and executable scripts hidden in paths (<code className="text-amber-400 font-mono">.php</code>, <code className="text-amber-400 font-mono">.asp</code>).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
            <div className="font-semibold text-zinc-200 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Credential Lure Token Scanning</span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Quantifies urgency lure words (e.g., <em>secure</em>, <em>verify</em>, <em>update</em>, <em>banking</em>, <em>login</em>) often placed in subdomains to trick mobile browser views.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
            <div className="font-semibold text-zinc-200 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>Host &amp; Protocol Topology</span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Differentiates legitimate domain names from raw IPv4/IPv6 addresses, evaluates unencrypted HTTP usage, and flags known URL shortener redirects (Bitly, TinyURL).
            </p>
          </div>
        </div>
      </div>

      {/* ── Dataset & Model Training ── */}
      <div className="card p-6 sm:p-8 space-y-5">
        <h2 className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight flex items-center gap-2.5">
          <Database className="w-5 h-5 text-amber-500" />
          <span>Multi-Source Training Dataset</span>
        </h2>
        <div className="space-y-3.5 text-sm sm:text-base text-zinc-300 leading-relaxed">
          <p>
            PhishGuard is trained on a unified, deduplicated corpus of <strong>22,511 verified URLs</strong> consolidated from Kaggle competition archives, PhishTank verified threat feeds, and the UCI Machine Learning Repository (PhiUSIIL benchmark).
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-center">
              <div className="text-2xl font-bold font-mono text-zinc-100">22,511</div>
              <div className="text-xs text-zinc-400 mt-0.5">Total Unified Records</div>
            </div>
            <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-center">
              <div className="text-2xl font-bold font-mono text-zinc-100">18,008</div>
              <div className="text-xs text-zinc-400 mt-0.5">Training Set (80%)</div>
            </div>
            <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-center">
              <div className="text-2xl font-bold font-mono text-zinc-100">4,503</div>
              <div className="text-xs text-zinc-400 mt-0.5">Held-out Test (20%)</div>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 pt-1">
            Data splits use stratified random sampling with fixed seeds (<code className="text-zinc-300 font-mono">random_state=42</code>) to ensure complete experimental reproducibility and zero label leakage.
          </p>
        </div>
      </div>

      {/* ── Technical Stack ── */}
      <div className="card p-6 sm:p-8 space-y-5">
        <h2 className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight flex items-center gap-2.5">
          <Cpu className="w-5 h-5 text-amber-500" />
          <span>Technical Architecture</span>
        </h2>

        <div className="divide-y divide-zinc-800/80 text-sm sm:text-base">
          <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="text-zinc-400 font-medium">Frontend Dashboard</span>
            <span className="text-zinc-200 font-mono text-xs sm:text-sm">React 18 · TypeScript · Vite · Tailwind CSS · Lucide</span>
          </div>
          <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="text-zinc-400 font-medium">Backend Screening API</span>
            <span className="text-zinc-200 font-mono text-xs sm:text-sm">Python 3.14 · FastAPI · Pydantic v2 · Uvicorn</span>
          </div>
          <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="text-zinc-400 font-medium">Machine Learning Core</span>
            <span className="text-zinc-200 font-mono text-xs sm:text-sm">scikit-learn · Random Forest (150 trees) · Logistic Regression</span>
          </div>
          <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="text-zinc-400 font-medium">Browser Protection</span>
            <span className="text-zinc-200 font-mono text-xs sm:text-sm">Chromium Manifest V3 Pre-Navigation Service Worker</span>
          </div>
          <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="text-zinc-400 font-medium">Local Audit Storage</span>
            <span className="text-zinc-200 font-mono text-xs sm:text-sm">Parameterized SQLite with URL query sanitization</span>
          </div>
        </div>
      </div>

      {/* ── Academic Affiliation & Authors ── */}
      <div className="card p-6 sm:p-8 space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight flex items-center gap-2.5">
          <GraduationCap className="w-5 h-5 text-amber-500" />
          <span>Academic Affiliation &amp; Contributors</span>
        </h2>
        <div className="text-sm sm:text-base text-zinc-300 space-y-2 leading-relaxed">
          <p>
            Developed as an academic technical seminar project at:
          </p>
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 text-sm">
            <div className="font-semibold text-zinc-100">School of Engineering &amp; Technology</div>
            <div className="text-zinc-400">Department of Computer Science &amp; Engineering (3rd Year B.Tech CSE)</div>
            <div className="text-zinc-400">Pimpri Chinchwad University, Pune, India</div>
          </div>
          <div className="pt-2 text-xs sm:text-sm text-zinc-400 space-y-1">
            <div><strong>Project Team (3rd Year B.Tech CSE):</strong></div>
            <div className="font-mono text-xs text-zinc-300">
              Kedar Kapse (kedar.kapse24@pcu.edu.in) · Ritesh Kumar (ritesh.kumar24@pcu.edu.in)
            </div>
            <div className="font-mono text-xs text-zinc-300">
              Saksham Sharma (saksham.sharma24@pcu.edu.in) · Saurabh Singh (saurabh.singh24@pcu.edu.in)
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-zinc-500 text-center leading-relaxed">
        PhishGuard is an academic screening tool. Always exercise caution when handling unknown links and unsolicited communications.
      </p>
    </div>
  )
}
