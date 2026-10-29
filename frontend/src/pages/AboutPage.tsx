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
                <td className="py-3 px-3 text-zinc-400">4–8 hr lag</td>
                <td className="py-3 px-3 text-zinc-400">Real-time</td>
                <td className="py-3 px-3 text-zinc-400">Real-time</td>
                <td className="py-3 px-3 text-emerald-400 font-semibold">Immediate (~13 ms)</td>
              </tr>
              <tr className="hover:bg-zinc-800/20">
                <td className="py-3 px-3 font-medium text-zinc-200">Triage Latency</td>
                <td className="py-3 px-3 text-zinc-400">50–150 ms</td>
                <td className="py-3 px-3 text-zinc-400">1,500–3,500 ms</td>
                <td className="py-3 px-3 text-zinc-400">1–5 ms</td>
                <td className="py-3 px-3 text-emerald-400 font-semibold">12.7 ms Median</td>
              </tr>
              <tr className="hover:bg-zinc-800/20">
                <td className="py-3 px-3 font-medium text-zinc-200">Client Drive-By Risk</td>
                <td className="py-3 px-3 text-zinc-400">Moderate</td>
                <td className="py-3 px-3 text-zinc-400">High (Fetches Scripts)</td>
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
                <td className="py-3 px-3 text-zinc-400">High (&gt; 12%)</td>
                <td className="py-3 px-3 text-emerald-400 font-semibold">0% (Domain Whitelist)</td>
              </tr>
              <tr className="hover:bg-zinc-800/20">
                <td className="py-3 px-3 font-medium text-zinc-200">Resilience to Partial Failure</td>
                <td className="py-3 px-3 text-zinc-500">N/A</td>
                <td className="py-3 px-3 text-zinc-400">Fails on timeout</td>
                <td className="py-3 px-3 text-zinc-500">None</td>
                <td className="py-3 px-3 text-emerald-400 font-semibold">Dynamic Aggregation</td>
              </tr>
              <tr className="hover:bg-zinc-800/20">
                <td className="py-3 px-3 font-medium text-zinc-200">Attribution &amp; XAI</td>
                <td className="py-3 px-3 text-zinc-500">None</td>
                <td className="py-3 px-3 text-zinc-400">Low</td>
                <td className="py-3 px-3 text-zinc-500">Opaque Score</td>
                <td className="py-3 px-3 text-emerald-400 font-semibold">48 Multi-View Features + Attribution</td>
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
            <span>48-Dimensional Multi-View Deception &amp; Divergence Pipeline</span>
          </h2>
          <p className="text-sm sm:text-base text-zinc-400">
            Every incoming address is transformed without network I/O into four complementary structural views plus character n-gram TF-IDF features.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
            <div className="font-semibold text-zinc-200 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>KL-Divergence &amp; Information Entropy</span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Computes Dirichlet-smoothed Kullback-Leibler divergence against benign domain character priors alongside Shannon entropy and alphanumeric transition rates.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
            <div className="font-semibold text-zinc-200 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-500"></span>
              <span>Homoglyph Brand-Domain Asymmetry</span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Detects visual confusables (<code className="text-amber-400 font-mono">paypa1</code>, <code className="text-amber-400 font-mono">rnicrosoft</code>), bounded Levenshtein typosquatting, and unauthorized brand placement in subdomains.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
            <div className="font-semibold text-zinc-200 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Public-Suffix-Aware Host Topology</span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Decomposes multi-label country TLDs (<code className="text-amber-400 font-mono">.co.in</code>, <code className="text-amber-400 font-mono">.ac.uk</code>), free cloud preview hosts, misplaced <code className="text-amber-400 font-mono">www</code> labels, and embedded TLD decoys.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
            <div className="font-semibold text-zinc-200 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
              <span>Dual-Modal Calibrated Stacking</span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Fuses L2 Logistic Regression, Balanced Random Forest, Histogram Gradient Boosting, and Character 3–5 Gram TF-IDF margins via out-of-fold sigmoid meta-stacking.
            </p>
          </div>
        </div>
      </div>

      {/* ── Dataset & Model Training ── */}
      <div className="card p-6 sm:p-8 space-y-5">
        <h2 className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight flex items-center gap-2.5">
          <Database className="w-5 h-5 text-amber-500" />
          <span>Domain-Disjoint Real-World Evaluation</span>
        </h2>
        <div className="space-y-3.5 text-sm sm:text-base text-zinc-300 leading-relaxed">
          <p>
            PhishGuard-Stack is trained and evaluated under strict <strong>registrable-domain-disjoint partitioning</strong> on <strong>11,429 real-world URLs</strong> across <strong>7,188 unique registrable domains</strong> (Hannousse &amp; Yahiouche, 2021), achieving <strong>93.00% test accuracy</strong> (0.9833 ROC-AUC), plus zero-shot validation on <strong>10,000 Ebbu2017 URLs (92.25%)</strong> and <strong>300 live 2026 OpenPhish URLs (90.33% recall)</strong>.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-center">
              <div className="text-2xl font-bold font-mono text-zinc-100">11,429</div>
              <div className="text-xs text-zinc-400 mt-0.5">Primary Real URLs (7,188 Domains)</div>
            </div>
            <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-center">
              <div className="text-2xl font-bold font-mono text-zinc-100">9,143</div>
              <div className="text-xs text-zinc-400 mt-0.5">Domain-Disjoint Train (80%)</div>
            </div>
            <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-center">
              <div className="text-2xl font-bold font-mono text-zinc-100">2,286</div>
              <div className="text-xs text-zinc-400 mt-0.5">Unseen-Domain Test (93.00% Acc)</div>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 pt-1">
            Data splits use <code className="text-zinc-300 font-mono">StratifiedGroupKFold</code> grouped by registrable root domain (<code className="text-zinc-300 font-mono">eTLD+1</code>) so zero domains overlap between training and testing.
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
            <span className="text-zinc-200 font-mono text-xs sm:text-sm">PhishGuard-Stack · LR + Balanced RF + HistGB + Char 3–5 Gram TF-IDF</span>
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
