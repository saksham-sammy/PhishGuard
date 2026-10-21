// Scan History page — Live real-time audit log categorized by Safe, Moderate, and High Risk
import { useEffect, useState, useRef } from 'react'
import { Trash2, RefreshCw, Download, Search, ShieldCheck, AlertCircle, AlertTriangle, Radio } from 'lucide-react'
import { fetchHistory, clearHistory } from '../services/api'
import type { HistoryEntry } from '../types'

type RiskFilter = 'all' | 'high' | 'medium' | 'low'

export default function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<RiskFilter>('all')
  const [livePulse, setLivePulse] = useState(false)
  const isMounted = useRef(true)

  const load = async (silent = false) => {
    if (!silent) setLoading(true)
    setError(null)
    try {
      const data = await fetchHistory()
      if (isMounted.current) {
        setEntries(data.entries)
        setTotal(data.total)
        if (silent) {
          setLivePulse(true)
          setTimeout(() => { if (isMounted.current) setLivePulse(false) }, 800)
        }
      }
    } catch (e: any) {
      if (isMounted.current && !silent) setError(e.message)
    } finally {
      if (isMounted.current && !silent) setLoading(false)
    }
  }

  // Auto-refresh interval (every 3 seconds) for real-time browsing updates
  useEffect(() => {
    isMounted.current = true
    load(false)

    const interval = setInterval(() => {
      load(true)
    }, 3000)

    // Listen for live extension scan events
    const handleLiveScan = (e: any) => {
      load(true)
    }
    window.addEventListener('phishguard-live-scan', handleLiveScan)

    return () => {
      isMounted.current = false
      clearInterval(interval)
      window.removeEventListener('phishguard-live-scan', handleLiveScan)
    }
  }, [])

  const handleClear = async () => {
    if (!confirm('Clear all stored scan history?')) return
    try {
      await clearHistory()
      setEntries([])
      setTotal(0)
    } catch (e: any) {
      setError(e.message)
    }
  }

  const exportCSV = () => {
    if (entries.length === 0) return
    const headers = ['ID', 'URL', 'Verdict', 'Risk', 'Score', 'Timestamp']
    const rows = entries.map(e => [
      e.id,
      `"${e.url_display.replace(/"/g, '""')}"`,
      e.predicted_class,
      e.risk_category,
      e.probability ?? '',
      e.scanned_at
    ])
    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const link = document.createElement('a')
    link.href = encodeURI(csv)
    link.download = `phishguard_scans_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
  }

  // Filter calculations
  const countHigh = entries.filter(e => e.risk_category === 'high' || e.predicted_class === 'phishing').length
  const countMedium = entries.filter(e => e.risk_category === 'medium').length
  const countLow = entries.filter(e => e.risk_category === 'low' && e.predicted_class !== 'phishing').length

  const filtered = entries.filter(e => {
    const matchesSearch = !searchQuery || e.url_display.toLowerCase().includes(searchQuery.toLowerCase())
    if (!matchesSearch) return false

    if (activeFilter === 'high') return e.risk_category === 'high' || e.predicted_class === 'phishing'
    if (activeFilter === 'medium') return e.risk_category === 'medium'
    if (activeFilter === 'low') return e.risk_category === 'low' && e.predicted_class !== 'phishing'
    return true
  })

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight">Browsing &amp; Scan History</h1>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors ${
              livePulse ? 'bg-emerald-500/25 border-emerald-500/40 text-emerald-300' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            }`}>
              <Radio className="w-3 h-3 animate-pulse" />
              <span>Live Sync</span>
            </span>
          </div>
          <p className="text-sm sm:text-base text-zinc-400 mt-1">
            Real-time audit log of addresses screened across open tabs and the browser extension.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          {entries.length > 0 && (
            <button onClick={exportCSV} className="btn-secondary flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium">
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          )}
          <button onClick={() => load(false)} disabled={loading} className="btn-secondary flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          {entries.length > 0 && (
            <button onClick={handleClear} className="btn-secondary text-rose-400 hover:text-rose-300 p-2 sm:px-3" title="Clear history">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── Category Filter Tabs (Safe, Moderate, High Risk, All) ── */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-b border-zinc-800/80 pb-4">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
            activeFilter === 'all'
              ? 'bg-zinc-100 text-zinc-900 font-semibold shadow-sm'
              : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
          }`}
        >
          All Scans ({entries.length})
        </button>

        <button
          onClick={() => setActiveFilter('high')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
            activeFilter === 'high'
              ? 'bg-rose-500 text-white font-semibold shadow-sm shadow-rose-900/30'
              : 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/15 border border-rose-500/20'
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          <span>High Risk / Phishing ({countHigh})</span>
        </button>

        <button
          onClick={() => setActiveFilter('medium')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
            activeFilter === 'medium'
              ? 'bg-amber-500 text-zinc-950 font-semibold shadow-sm shadow-amber-900/30'
              : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/15 border border-amber-500/20'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Moderate Risk ({countMedium})</span>
        </button>

        <button
          onClick={() => setActiveFilter('low')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
            activeFilter === 'low'
              ? 'bg-emerald-500 text-zinc-950 font-semibold shadow-sm shadow-emerald-900/30'
              : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/15 border border-emerald-500/20'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Safe / Normal ({countLow})</span>
        </button>
      </div>

      {/* ── Search Bar ── */}
      {entries.length > 0 && (
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search audited addresses by keyword or domain..."
            className="w-full bg-[#15161c] border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 font-mono"
          />
        </div>
      )}

      {loading && entries.length === 0 && (
        <div className="py-24 text-center text-sm text-zinc-500">
          Loading audit entries...
        </div>
      )}

      {!loading && entries.length === 0 && !error && (
        <div className="card text-center py-20 text-zinc-500 space-y-2">
          <p className="text-base text-zinc-300 font-medium">No browsing or scan history recorded yet</p>
          <p className="text-sm text-zinc-500">Check a web link in the Scanner tab or browse with the PhishGuard extension active to see live records here.</p>
        </div>
      )}

      {/* ── History Table ── */}
      {filtered.length > 0 && (
        <div className="card overflow-hidden p-0 divide-y divide-zinc-800/80">
          {filtered.map(e => {
            const isHigh = e.risk_category === 'high' || e.predicted_class === 'phishing'
            const isMedium = e.risk_category === 'medium'

            return (
              <div key={e.id} className="p-4 sm:p-5 flex items-center justify-between gap-4 text-sm hover:bg-zinc-800/30 transition-colors">
                <div className="min-w-0 space-y-1">
                  <div className="font-mono text-zinc-100 font-medium truncate text-sm sm:text-base">{e.url_display}</div>
                  <div className="text-xs text-zinc-500 font-sans flex items-center gap-2">
                    <span>{new Date(e.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    <span>·</span>
                    <span>{new Date(e.scanned_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  {e.probability !== null && (
                    <span className="hidden sm:inline font-mono text-xs text-zinc-400">
                      {(e.probability * 100).toFixed(1)}%
                    </span>
                  )}
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                    isHigh
                      ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                      : isMedium
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  }`}>
                    {isHigh ? 'High Risk' : isMedium ? 'Moderate' : 'Safe'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!loading && entries.length > 0 && filtered.length === 0 && (
        <div className="card text-center py-16 text-zinc-500 space-y-1">
          <p className="text-sm text-zinc-300">No records match the selected filter.</p>
          <button onClick={() => { setActiveFilter('all'); setSearchQuery('') }} className="text-xs text-amber-400 hover:underline">
            Reset filters
          </button>
        </div>
      )}
    </div>
  )
}
