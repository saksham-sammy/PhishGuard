import {
  ShieldCheck, AlertTriangle, Copy, Check, ChevronDown, ChevronUp,
  RotateCcw, Lock, Globe, Gauge, Layers, Activity
} from 'lucide-react'
import { useState } from 'react'
import type { ScanResult } from '../types'

interface ResultCardProps {
  result: ScanResult
  onReset: () => void
}

const FEATURE_NAMES: Record<string, string> = {
  // View I: Classical Lexical (24)
  url_length: 'Total URL length',
  hostname_length: 'Hostname length',
  path_length: 'Path length',
  query_length: 'Query string length',
  dot_count: 'Dot count',
  hyphen_count: 'Hyphen count',
  underscore_count: 'Underscore count',
  slash_count: 'Slash count',
  question_mark_count: 'Question mark count',
  equal_count: 'Equals (=) count',
  ampersand_count: 'Ampersand (&) count',
  at_symbol: 'Contains @ userinfo trick',
  double_slash_redirect: 'Path // redirect pattern',
  subdomain_count: 'Public-suffix subdomain depth',
  digit_count: 'Total digits in URL',
  special_char_count: 'Special symbol count',
  suspicious_keyword_count: 'Phishing lure keyword count',
  https: 'HTTPS scheme present',
  ip_host: 'Raw IP literal host',
  is_shortener: 'URL shortener service',
  hostname_entropy: 'Hostname Shannon entropy',
  has_port: 'Explicit non-default port',
  has_fragment: 'URI #fragment present',
  tld_in_path: 'Executable/TLD token in path',
  // View II: eTLD+1 Topology (8)
  sld_length: 'Registrable SLD length',
  tld_length: 'Effective TLD suffix length',
  has_www: 'Leading www. prefix',
  www_misplaced: 'Misplaced inner www token',
  path_depth: 'Directory path depth',
  longest_token_length: 'Longest host/path token',
  tld_in_subdomain: 'Embedded TLD in subdomain',
  host_url_ratio: 'Hostname-to-URL length ratio',
  // View III: Brand Deception (8)
  brand_spoof_score: 'Brand spoofing divergence (Δ_brand)',
  sld_typosquat_score: 'SLD typosquatting score (τ_typo)',
  brand_in_subdomain: 'Unauthorized brand in subdomain',
  host_keyword_count: 'Lure keywords inside hostname',
  suspicious_tld: 'High-abuse TLD registry',
  free_hosting_host: 'Shared cloud / free-hosting host',
  punycode_idn: 'Punycode IDN (xn--) homograph',
  digits_in_sld: 'Digits inside registrable SLD',
  // View IV: Divergence & Morphology (8)
  path_entropy: 'URL path Shannon entropy',
  hostname_kl_divergence: 'Dirichlet KL-divergence (D_KL)',
  char_transition_rate: 'Char-class transition rate (ρ_switch)',
  digit_ratio_host: 'Hostname digit ratio',
  vowel_ratio: 'SLD vowel ratio',
  max_consonant_run: 'Max consecutive consonant run',
  uppercase_ratio: 'URI uppercase character ratio',
  percent_encoding_count: 'Percent-encoded (%XX) triplets',
}

const ENSEMBLE_LABELS: Record<string, string> = {
  logistic_regression: 'L2 Logistic Regression (48f)',
  random_forest: 'Balanced Random Forest (200 trees)',
  hist_gradient_boosting: 'HistGradientBoosting (Leaf-wise)',
  char_ngram_margin: 'Char 3–5 Gram TF-IDF Margin',
  calibrated_stack: 'PhishGuard-Stack (OOF Calibrated)',
}

export default function ResultCard({ result, onReset }: ResultCardProps) {
  const [showTechnical, setShowTechnical] = useState(false)
  const [copied, setCopied] = useState(false)

  const isPhishing = result.predicted_class === 'phishing'
  const risk = result.risk_category
  const isFlagged = isPhishing || risk !== 'low'

  const handleCopy = () => {
    const text = `PhishGuard Link Inspection Report:
URL: ${result.url}
Verdict: ${isPhishing ? 'Suspicious / Phishing' : 'Safe / Legitimate'}
Risk Tier: ${risk.toUpperCase()}
Calibrated Score: ${result.probability !== null ? (result.probability * 100).toFixed(2) + '%' : 'Verified Domain'}
Analysis: ${result.explanation}
${result.warnings.length > 0 ? `Indicators:\n${result.warnings.map(w => ` - ${w}`).join('\n')}` : ''}
Timestamp: ${result.scanned_at}`

    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const breakdownEntries = result.ensemble_breakdown
    ? Object.entries(result.ensemble_breakdown).filter(([k]) => k in ENSEMBLE_LABELS)
    : []
  const disagreement = result.ensemble_breakdown?.epistemic_disagreement

  return (
    <div className="space-y-5">
      {/* ── Main Verdict Card (Calm neutral zinc + warm amber / emerald accents) ── */}
      <div
        className={`card border rounded-2xl p-6 sm:p-8 transition-all duration-200 ${
          isFlagged ? 'border-amber-500/30' : 'border-emerald-500/25'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-4">
            <div
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                isFlagged
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
              }`}
            >
              {isFlagged ? (
                <AlertTriangle className="w-6 h-6 sm:w-7 sm:h-7" />
              ) : (
                <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7" />
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h3 className="font-bold text-xl sm:text-2xl text-zinc-100 tracking-tight">
                  {isPhishing ? 'Suspicious Link' : risk === 'medium' ? 'Review Recommended' : 'Looks Safe'}
                </h3>
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                    risk === 'high'
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      : risk === 'medium'
                      ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                      : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  }`}
                >
                  {risk === 'high' ? 'Elevated Risk' : risk === 'medium' ? 'Moderate Risk' : 'Low Risk'}
                </span>
              </div>
              <p className="text-sm font-mono text-zinc-400 mt-1 break-all max-w-xl">
                {result.url}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto flex-shrink-0">
            <button
              onClick={handleCopy}
              className="btn-secondary flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium"
              title="Copy triage report"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Share Report'}</span>
            </button>
            <button
              onClick={onReset}
              className="btn-secondary flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium"
              title="Check another address"
            >
              <RotateCcw className="w-4 h-4" />
              <span>New Link</span>
            </button>
          </div>
        </div>

        {/* Readable Explanation */}
        <p className="mt-5 pt-5 border-t border-zinc-800/80 text-sm sm:text-base text-zinc-300 leading-relaxed font-normal">
          {result.explanation}
        </p>

        {/* Structural Indicators (Calm zinc container with amber bullets) */}
        {result.warnings.length > 0 && (
          <div className="mt-4 space-y-2 bg-zinc-900/70 border border-zinc-800 rounded-xl p-4">
            <div className="text-xs uppercase tracking-wider font-semibold text-amber-400">
              Structural &amp; Lexical Signals
            </div>
            {result.warnings.map((w, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-zinc-300 leading-snug">
                <span className="text-amber-400 font-bold mt-0.5">•</span>
                <span>{w}</span>
              </div>
            ))}
          </div>
        )}

        {/* Highlighted Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-zinc-800/80 text-sm">
          <div className="bg-zinc-900/70 rounded-xl p-3.5 border border-zinc-800/80">
            <div className="text-xs text-zinc-400 uppercase tracking-wider font-medium">Protocol</div>
            <div className="font-semibold text-zinc-100 text-sm sm:text-base mt-1 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-zinc-400" />
              <span>{result.features.https ? 'HTTPS Encrypted' : 'HTTP Unencrypted'}</span>
            </div>
          </div>

          <div className="bg-zinc-900/70 rounded-xl p-3.5 border border-zinc-800/80">
            <div className="text-xs text-zinc-400 uppercase tracking-wider font-medium">Host Addressing</div>
            <div className="font-semibold text-zinc-100 text-sm sm:text-base mt-1 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-zinc-400" />
              <span>
                {result.features.ip_host
                  ? 'Numerical IP'
                  : result.features.free_hosting_host
                  ? 'Shared Cloud Host'
                  : 'Standard Domain'}
              </span>
            </div>
          </div>

          <div className="bg-zinc-900/70 rounded-xl p-3.5 border border-zinc-800/80">
            <div className="text-xs text-zinc-400 uppercase tracking-wider font-medium">Calibrated Score</div>
            <div className="font-semibold text-zinc-100 text-sm sm:text-base mt-1 flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-zinc-400" />
              <span>{result.probability !== null ? `${(result.probability * 100).toFixed(1)}%` : 'Verified Domain'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Ensemble Sub-Model Breakdown ── */}
      {breakdownEntries.length > 0 && (
        <div className="card border-zinc-800/80 p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="text-sm sm:text-base font-semibold text-zinc-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-500" />
              <span>Ensemble Sub-Model Posteriors</span>
            </div>
            {disagreement !== undefined && (
              <span className="text-xs font-mono text-zinc-400 bg-zinc-900 px-2.5 py-1 rounded-lg border border-zinc-800">
                Disagreement σ: {disagreement.toFixed(4)}
              </span>
            )}
          </div>

          <div className="space-y-3">
            {breakdownEntries.map(([key, prob]) => {
              const pct = Math.min(100, Math.max(0, prob * 100))
              const isMeta = key === 'calibrated_stack'
              const barColor = prob >= 0.5 ? 'bg-amber-500' : 'bg-emerald-500'
              return (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className={isMeta ? 'font-semibold text-amber-400' : 'text-zinc-300'}>
                      {ENSEMBLE_LABELS[key] || key}
                    </span>
                    <span className="font-mono font-semibold text-zinc-200">{pct.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`${barColor} h-1.5 rounded-full transition-all duration-300`}
                      style={{ width: `${Math.max(2, pct)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Feature Attributions ── */}
      {result.feature_attributions && result.feature_attributions.length > 0 && (
        <div className="card border-zinc-800/80 p-5 sm:p-6 space-y-4">
          <div className="text-sm sm:text-base font-semibold text-zinc-200 flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-500" />
            <span>Instance Feature Attributions (vs. Benign Baseline)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs sm:text-sm">
            {result.feature_attributions.slice(0, 6).map((attr) => {
              const up = attr.contribution >= 0
              return (
                <div
                  key={attr.feature}
                  className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/70 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-zinc-200 truncate">
                      {FEATURE_NAMES[attr.feature] || attr.feature}
                    </div>
                    <div className="text-xs text-zinc-500 font-mono">
                      val={attr.value} · baseline={attr.benign_baseline}
                    </div>
                  </div>
                  <span
                    className={`font-mono text-xs font-semibold px-2 py-0.5 rounded-md border flex-shrink-0 ${
                      up
                        ? 'text-amber-300 bg-amber-500/10 border-amber-500/25'
                        : 'text-emerald-300 bg-emerald-500/10 border-emerald-500/25'
                    }`}
                  >
                    {up ? '+' : ''}
                    {attr.contribution.toFixed(3)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Collapsible 48-Feature Technical Breakdown ── */}
      <div className="card border-zinc-800/80 p-5">
        <button
          onClick={() => setShowTechnical(!showTechnical)}
          className="w-full flex items-center justify-between text-sm sm:text-base text-zinc-300 hover:text-white font-medium transition-colors"
        >
          <span>Technical Feature Breakdown (48 Multi-View Features)</span>
          {showTechnical ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
        </button>

        {showTechnical && (
          <div className="mt-4 pt-4 border-t border-zinc-800/70 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs sm:text-sm">
            {Object.entries(result.features).map(([key, val]) => {
              const label = FEATURE_NAMES[key] || key
              const displayVal = typeof val === 'number'
                ? (Number.isInteger(val) ? val.toLocaleString() : val.toFixed(2))
                : val ? 'Yes' : 'No'
              return (
                <div key={key} className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/60 gap-2">
                  <span className="text-zinc-400 truncate" title={key}>{label}</span>
                  <span className="font-mono text-zinc-100 font-semibold flex-shrink-0">{String(displayVal)}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Discreet Disclaimer ── */}
      <p className="text-xs text-zinc-500 text-center px-4 leading-relaxed">
        {result.disclaimer}
      </p>
    </div>
  )
}
