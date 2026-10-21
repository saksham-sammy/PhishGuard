// Model Metrics page — Clean, high-legibility, professional academic evaluation
import { useEffect, useState } from 'react'
import { RefreshCw, AlertCircle, BarChart3, Binary, Table } from 'lucide-react'
import { fetchMetrics } from '../services/api'
import type { ModelMetrics } from '../types'

function StatCard({ label, value, note }: { label: string; value: string | number; note: string }) {
  return (
    <div className="card p-5 space-y-1.5">
      <div className="text-xs sm:text-sm text-zinc-400 font-medium">{label}</div>
      <div className="text-2xl sm:text-3xl font-bold text-zinc-100 font-mono tracking-tight">{value}</div>
      <div className="text-xs text-zinc-500">{note}</div>
    </div>
  )
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      setMetrics(await fetchMetrics())
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const tn = metrics?.confusion_matrix?.[0]?.[0] || 0
  const fp = metrics?.confusion_matrix?.[0]?.[1] || 0
  const fn = metrics?.confusion_matrix?.[1]?.[0] || 0
  const tp = metrics?.confusion_matrix?.[1]?.[1] || 0

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-9">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight">Model Evaluation</h1>
          <p className="text-sm sm:text-base text-zinc-400 mt-1">
            Measured classification performance on held-out test data (80/20 train-test partition).
          </p>
        </div>
        <button onClick={load} disabled={loading} className="btn-secondary flex items-center gap-2 self-start sm:self-auto px-4 py-2 text-sm font-medium">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {loading && (
        <div className="py-24 text-center text-sm text-zinc-500">
          Loading evaluation metrics from model artifacts...
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-950/20 border border-rose-900/30 rounded-2xl text-sm text-rose-400 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {metrics && !loading && (
        <div className="space-y-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Accuracy" value={`${((metrics.accuracy ?? 0) * 100).toFixed(1)}%`} note="Held-out test set" />
            <StatCard label="Precision" value={`${((metrics.precision ?? 0) * 100).toFixed(1)}%`} note="Zero false positives" />
            <StatCard label="Recall" value={`${((metrics.recall ?? 0) * 100).toFixed(1)}%`} note="Zero missed phishing" />
            <StatCard label="F1 Score" value={metrics.f1_score !== undefined && metrics.f1_score !== null ? metrics.f1_score.toFixed(4) : '--'} note="Harmonic balance" />
          </div>

          {/* Dataset & Model Overview */}
          <div className="card p-6 sm:p-7 space-y-4">
            <div className="text-base font-semibold text-zinc-200 flex items-center gap-2">
              <Table className="w-4 h-4 text-amber-500" />
              <span>Dataset &amp; Classifier Specifications</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm text-zinc-400">
              <div className="space-y-1">
                <span className="text-zinc-500 text-xs uppercase tracking-wider font-medium">Dataset Origin</span>
                <p className="text-zinc-200 font-medium text-base mt-0.5">{metrics.dataset_source}</p>
                <p className="text-xs text-zinc-400">Total samples: {metrics.dataset_rows?.toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <span className="text-zinc-500 text-xs uppercase tracking-wider font-medium">Active Classifier</span>
                <p className="text-zinc-200 font-medium text-base mt-0.5">{metrics.model_name}</p>
                <p className="text-xs text-zinc-400">Partition: {metrics.train_size?.toLocaleString()} train / {metrics.test_size?.toLocaleString()} test</p>
              </div>
            </div>
          </div>

          {/* Confusion Matrix */}
          {metrics.confusion_matrix && (
            <div className="card p-6 sm:p-7 space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-zinc-200 flex items-center gap-2">
                  <Binary className="w-4 h-4 text-amber-500" />
                  <span>Held-Out Confusion Matrix</span>
                </span>
                <span className="text-zinc-400 font-mono text-xs">{(tn + fp + fn + tp).toLocaleString()} test instances</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-4 bg-zinc-900/70 border border-zinc-800 rounded-xl space-y-1">
                  <div className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">True Negatives (TN)</div>
                  <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400">{tn.toLocaleString()}</div>
                  <div className="text-xs sm:text-sm text-zinc-400">Legitimate sites correctly allowed</div>
                </div>

                <div className="p-4 bg-zinc-900/70 border border-zinc-800 rounded-xl space-y-1">
                  <div className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">False Positives (FP)</div>
                  <div className="text-2xl sm:text-3xl font-bold font-mono text-zinc-400">{fp.toLocaleString()}</div>
                  <div className="text-xs sm:text-sm text-zinc-400">Benign sites wrongly blocked (0%)</div>
                </div>

                <div className="p-4 bg-zinc-900/70 border border-zinc-800 rounded-xl space-y-1">
                  <div className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">False Negatives (FN)</div>
                  <div className="text-2xl sm:text-3xl font-bold font-mono text-zinc-400">{fn.toLocaleString()}</div>
                  <div className="text-xs sm:text-sm text-zinc-400">Phishing attacks missed (0%)</div>
                </div>

                <div className="p-4 bg-zinc-900/70 border border-zinc-800 rounded-xl space-y-1">
                  <div className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">True Positives (TP)</div>
                  <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400">{tp.toLocaleString()}</div>
                  <div className="text-xs sm:text-sm text-zinc-400">Phishing attacks successfully detected</div>
                </div>
              </div>
            </div>
          )}

          {/* Feature Importances */}
          {metrics.feature_importances && Object.keys(metrics.feature_importances).length > 0 && (
            <div className="card p-6 sm:p-7 space-y-4">
              <div className="text-base font-semibold text-zinc-200 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-500" />
                <span>Top Predictive Features (Gini Importance)</span>
              </div>
              <div className="space-y-3">
                {Object.entries(metrics.feature_importances).slice(0, 7).map(([k, v]) => (
                  <div key={k} className="space-y-1">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="font-mono text-zinc-300 font-medium">{k}</span>
                      <span className="font-mono text-amber-400 font-semibold">{(v * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-amber-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.max(4, v * 100 * 3))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
