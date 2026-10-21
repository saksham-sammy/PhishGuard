// Scanner page — Minimalist, humanized, calm cybersecurity link checker
import { useState } from 'react'
import ScannerInput from '../components/ScannerInput'
import ResultCard from '../components/ResultCard'
import { scanUrl } from '../services/api'
import type { ScanResult } from '../types'

interface ExampleLink {
  title: string
  url: string
  note: string
}

const EXAMPLES: ExampleLink[] = [
  { title: 'Brand Spoof', url: 'http://paypal-secure-login.com', note: 'Hyphenated brand lure' },
  { title: 'Raw IP Host', url: 'http://192.168.1.1/login.php', note: 'Direct IP address' },
  { title: '@ Redirect', url: 'http://www.paypal.com@verify-account-security-alert.xyz/update', note: 'RFC 3986 trick' },
  { title: 'Subdomain Cloak', url: 'http://apple.com.login-verify-account.security-update.online/auth', note: 'Deep nesting' },
  { title: 'Normal Search', url: 'https://www.google.com/search?q=seminar+report+latex', note: 'Google search query' },
  { title: 'Safe Domain', url: 'https://www.github.com', note: 'Official repository' },
]

export default function ScannerPage() {
  const [result, setResult] = useState<ScanResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleScan = async (url: string) => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const data = await scanUrl(url)
      setResult(data)
    } catch (err: any) {
      setError(err.message ?? 'Unable to connect to the screening engine.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 sm:py-16 space-y-10">
      {/* ── Sleek Minimalist Hero (No distracting middle logo) ── */}
      <div className="text-center space-y-3.5">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-zinc-100 tracking-tight">
          Check any web link before you click.
        </h1>
        <p className="text-base sm:text-lg text-zinc-400 max-w-xl mx-auto leading-relaxed font-normal">
          Instant, privacy-first URL screening. Structural and lexical indicators are evaluated safely without connecting to the remote host.
        </p>
      </div>

      {/* ── Input Card ── */}
      {!result && (
        <div className="space-y-6">
          <ScannerInput onScan={handleScan} loading={loading} error={error} />

          {/* Quick Clickable Examples */}
          <div className="space-y-2.5 pt-2">
            <div className="text-xs sm:text-sm text-zinc-400 font-medium">Try testing an example scenario:</div>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => handleScan(ex.url)}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium text-zinc-300 hover:text-white bg-zinc-900/80 hover:bg-zinc-800/90 border border-zinc-800 transition-all duration-150 shadow-sm"
                  title={`${ex.url} (${ex.note})`}
                >
                  {ex.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Result Card ── */}
      {result && (
        <ResultCard result={result} onReset={() => setResult(null)} />
      )}

      {/* ── Minimalist Context Footer ── */}
      <div className="pt-8 border-t border-zinc-900/80 flex flex-col sm:flex-row items-center justify-between text-xs sm:text-sm text-zinc-500 gap-3">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80"></span>
          Zero-Fetch Inspection · Zero Client Risk
        </span>
        <span>Evaluated on 22,500+ Verified &amp; Kaggle Records</span>
      </div>
    </div>
  )
}
