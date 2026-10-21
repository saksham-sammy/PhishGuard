import {
  ShieldCheck, AlertCircle, Copy, Check, ChevronDown, ChevronUp, RotateCcw, Lock, Globe, Gauge
} from 'lucide-react'
import { useState } from 'react'
import type { ScanResult } from '../types'

interface ResultCardProps {
  result: ScanResult
  onReset: () => void
}

const FEATURE_NAMES: Record<string, string> = {
  url_length: 'Total URL length',
  hostname_length: 'Domain hostname length',
  path_length: 'URL path length',
  dot_count: 'Dots in address',
  hyphen_count: 'Hyphens in address',
  subdomain_count: 'Subdomain depth',
  at_symbol: 'Contains @ symbol (userinfo)',
  ip_host: 'Raw numerical IP host',
  is_shortener: 'Shortened URL service',
  https: 'HTTPS encryption protocol',
  suspicious_keyword_count: 'Phishing lure keyword count',
  hostname_entropy: 'Shannon character entropy',
  double_slash_redirect: 'Path redirect trick (//)',
  tld_in_path: 'Executable/script extension in path',
}

export default function ResultCard({ result, onReset }: ResultCardProps) {
  const [showTechnical, setShowTechnical] = useState(false)
  const [copied, setCopied] = useState(false)

  const isPhishing = result.predicted_class === 'phishing'
  const isHighRisk = result.risk_category === 'high'

  const handleCopy = () => {
    const text = `PhishGuard Link Inspection Report:
URL: ${result.url}
Verdict: ${isPhishing ? 'Suspicious / Phishing' : 'Safe / Legitimate'}
Risk Category: ${result.risk_category.toUpperCase()}
Confidence Score: ${result.probability !== null ? (result.probability * 100).toFixed(1) + '%' : 'N/A'}
Analysis: ${result.explanation}
${result.warnings.length > 0 ? `Warnings:\n${result.warnings.map(w => ` - ${w}`).join('\n')}` : ''}
Timestamp: ${result.scanned_at}`

    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-5">
      {/* ── Main Verdict Card ── */}
      <div className={`card border rounded-2xl p-6 sm:p-8 transition-all duration-200 ${
        isPhishing
          ? 'bg-[#181416] border-rose-900/50 text-rose-100'
          : 'bg-[#131815] border-emerald-900/50 text-emerald-100'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-4">
            <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${
              isPhishing
                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
            }`}>
              {isPhishing ? <AlertCircle className="w-6 h-6 sm:w-7 sm:h-7" /> : <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7" />}
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="font-bold text-xl sm:text-2xl text-white tracking-tight">
                  {isPhishing ? 'Suspicious Link' : 'Looks Safe'}
                </h3>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                  isPhishing
                    ? (isHighRisk ? 'bg-rose-500/15 text-rose-300 border-rose-500/30' : 'bg-amber-500/15 text-amber-300 border-amber-500/30')
                    : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                }`}>
                  {isPhishing ? (isHighRisk ? 'High Risk' : 'Medium Risk') : 'Low Risk'}
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

        {/* Humanized Readable Explanation */}
        <p className="mt-5 pt-5 border-t border-zinc-800/80 text-sm sm:text-base text-zinc-300 leading-relaxed font-normal">
          {result.explanation}
        </p>

        {/* Warning Indicators if any */}
        {result.warnings.length > 0 && (
          <div className="mt-4 space-y-2 bg-rose-950/20 border border-rose-900/40 rounded-xl p-3.5">
            <div className="text-xs uppercase tracking-wider font-semibold text-rose-300">Identified Risk Factors:</div>
            {result.warnings.map((w, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-rose-200/90 leading-snug">
                <span className="text-rose-400 font-bold mt-0.5">•</span>
                <span>{w}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── Highlighted Badges (Only essential info) ── */}
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
              <span>{result.features.ip_host ? 'Numerical IP' : 'Standard Domain'}</span>
            </div>
          </div>

          <div className="bg-zinc-900/70 rounded-xl p-3.5 border border-zinc-800/80">
            <div className="text-xs text-zinc-400 uppercase tracking-wider font-medium">Model Confidence</div>
            <div className="font-semibold text-zinc-100 text-sm sm:text-base mt-1 flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-zinc-400" />
              <span>{result.probability !== null ? `${(result.probability * 100).toFixed(1)}%` : 'Rule Screened'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Collapsible Technical Breakdown for Viva / Seminar ── */}
      <div className="card border-zinc-800/80 p-5">
        <button
          onClick={() => setShowTechnical(!showTechnical)}
          className="w-full flex items-center justify-between text-sm sm:text-base text-zinc-300 hover:text-white font-medium transition-colors"
        >
          <span>Technical Feature Breakdown (For Evaluators &amp; Viva)</span>
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
                <div key={key} className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/60">
                  <span className="text-zinc-400">{label}</span>
                  <span className="font-mono text-zinc-100 font-semibold">{String(displayVal)}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Discreet Disclaimer ── */}
      <p className="text-xs text-zinc-500 text-center px-4 leading-relaxed">
        PhishGuard provides an empirical machine-learning estimate based on URL structure and lexical patterns. It serves as a screening filter and does not guarantee that any address is safe or malicious.
      </p>
    </div>
  )
}
