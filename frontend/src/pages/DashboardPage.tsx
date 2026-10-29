// Model Metrics page — Clean, high-legibility, professional academic evaluation
import { useEffect, useState } from 'react'
import { RefreshCw, AlertCircle, BarChart3, Binary, Table, Layers, Globe } from 'lucide-react'
import { fetchMetrics } from '../services/api'
import type { ModelMetrics } from '../types'

function StatCard({ label, value, note }: { label: string; value: string | number; note: string }) {
  return (
    <div className="card p-5 space-y-1.5">
      <div className="text-xs sm:text-sm text-zinc-400 font-medium">{label}</div>
      <div className="text-2xl sm:text-3xl font-bold text-zinc-100 font-mono tracking-tight">{value}</div>
      <div className="text-xs text-zinc-500 leading-snug">{note}</div>
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
  const negTotal = Math.max(1, tn + fp)
  const posTotal = Math.max(1, tp + fn)

  const accCi = metrics?.bootstrap_95ci?.accuracy
  const cvMeanAcc = metrics?.cv_5fold?.mean?.accuracy
  const cvStdAcc = metrics?.cv_5fold?.std?.accuracy
  const ebbu = metrics?.ood_benchmarks?.ebbu2017_cross_corpus
  const openphish = metrics?.ood_benchmarks?.openphish_2026_zeroday

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-9">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight">Model Evaluation</h1>
          <p className="text-sm sm:text-base text-zinc-400 mt-1">
            Domain-disjoint classification performance on unseen registrable domains (80/20 partition, 0% overlap).
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="btn-secondary flex items-center gap-2 self-start sm:self-auto px-4 py-2 text-sm font-medium"
        >
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
        <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl text-sm text-zinc-300 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {metrics && !loading && (
        <div className="space-y-8">
          {/* ── Key Metrics ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              label="Accuracy"
              value={`${((metrics.accuracy ?? 0) * 100).toFixed(2)}%`}
              note={
                accCi
                  ? `95% CI: ${(accCi[0] * 100).toFixed(1)}–${(accCi[1] * 100).toFixed(1)}%`
                  : 'Held-out unseen domains'
              }
            />
            <StatCard
              label="Precision"
              value={`${((metrics.precision ?? 0) * 100).toFixed(2)}%`}
              note={`FPR: ${((metrics.fpr ?? fp / negTotal) * 100).toFixed(2)}% (${fp} FP)`}
            />
            <StatCard
              label="Recall"
              value={`${((metrics.recall ?? 0) * 100).toFixed(2)}%`}
              note={`FNR: ${((metrics.fnr ?? fn / posTotal) * 100).toFixed(2)}% (${fn} FN)`}
            />
            <StatCard
              label="F1 Score"
              value={metrics.f1_score !== undefined && metrics.f1_score !== null ? metrics.f1_score.toFixed(4) : '--'}
              note="Harmonic balance"
            />
            <StatCard
              label="ROC-AUC"
              value={metrics.roc_auc !== undefined ? metrics.roc_auc.toFixed(4) : '--'}
              note={`PR-AUC: ${metrics.pr_auc !== undefined ? metrics.pr_auc.toFixed(4) : '--'}`}
            />
            <StatCard
              label="Brier Score"
              value={metrics.brier_score !== undefined ? metrics.brier_score.toFixed(4) : '--'}
              note="Probability calibration loss"
            />
            <StatCard
              label="Calib. Error (ECE)"
              value={metrics.ece !== undefined ? metrics.ece.toFixed(4) : '--'}
              note="10-bin reliability error"
            />
            <StatCard
              label="5-Fold Domain CV"
              value={cvMeanAcc !== undefined ? `${(cvMeanAcc * 100).toFixed(2)}%` : '--'}
              note={cvStdAcc !== undefined ? `± ${(cvStdAcc * 100).toFixed(2)}% across 5 folds` : 'GroupKFold'}
            />
          </div>

          {/* ── Dataset & Model Overview ── */}
          <div className="card p-6 sm:p-7 space-y-4">
            <div className="text-base font-semibold text-zinc-200 flex items-center gap-2">
              <Table className="w-4 h-4 text-amber-500" />
              <span>Dataset &amp; Classifier Specifications</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm text-zinc-400">
              <div className="space-y-1">
                <span className="text-zinc-500 text-xs uppercase tracking-wider font-medium">Dataset Origin</span>
                <p className="text-zinc-200 font-medium text-sm sm:text-base mt-0.5">{metrics.dataset_source}</p>
                <p className="text-xs text-zinc-400">
                  Total samples: {metrics.dataset_rows?.toLocaleString()} ({metrics.unique_domains?.toLocaleString()} unique domains)
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-zinc-500 text-xs uppercase tracking-wider font-medium">Active Classifier</span>
                <p className="text-zinc-200 font-medium text-sm sm:text-base mt-0.5">{metrics.model_name}</p>
                <p className="text-xs text-zinc-400">
                  Partition: {metrics.train_size?.toLocaleString()} train / {metrics.test_size?.toLocaleString()} unseen-domain test · 0% overlap
                </p>
              </div>
            </div>
          </div>

          {/* ── Held-Out Confusion Matrix (Neutral dark zinc aesthetic) ── */}
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
                  <div className="text-xs sm:text-sm text-zinc-400">
                    Legitimate sites correctly allowed ({((tn / negTotal) * 100).toFixed(2)}%)
                  </div>
                </div>

                <div className="p-4 bg-zinc-900/70 border border-zinc-800 rounded-xl space-y-1">
                  <div className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">False Positives (FP)</div>
                  <div className="text-2xl sm:text-3xl font-bold font-mono text-zinc-200">{fp.toLocaleString()}</div>
                  <div className="text-xs sm:text-sm text-zinc-400">
                    Ambiguous benign URLs flagged ({((fp / negTotal) * 100).toFixed(2)}% FPR)
                  </div>
                </div>

                <div className="p-4 bg-zinc-900/70 border border-zinc-800 rounded-xl space-y-1">
                  <div className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">False Negatives (FN)</div>
                  <div className="text-2xl sm:text-3xl font-bold font-mono text-zinc-200">{fn.toLocaleString()}</div>
                  <div className="text-xs sm:text-sm text-zinc-400">
                    Clean-SaaS / compromised-host phish missed ({((fn / posTotal) * 100).toFixed(2)}% FNR)
                  </div>
                </div>

                <div className="p-4 bg-zinc-900/70 border border-zinc-800 rounded-xl space-y-1">
                  <div className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">True Positives (TP)</div>
                  <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400">{tp.toLocaleString()}</div>
                  <div className="text-xs sm:text-sm text-zinc-400">
                    Phishing URLs detected ({((tp / posTotal) * 100).toFixed(2)}% Recall)
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Comparison Against Existing Lexical Systems ── */}
          {metrics.baseline_comparison && (
            <div className="card p-6 sm:p-7 space-y-4">
              <div className="text-base font-semibold text-zinc-200 flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-500" />
                <span>Proposed vs. Existing Lexical URL Systems</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-400">
                      <th className="py-2.5 px-3 font-semibold">System / Lexical Baseline</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Acc.</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Prec.</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Rec.</th>
                      <th className="py-2.5 px-3 font-semibold text-right">F1</th>
                      <th className="py-2.5 px-3 font-semibold text-right">AUC</th>
                      <th className="py-2.5 px-3 font-semibold text-right">FPR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {Object.entries(metrics.baseline_comparison).map(([name, row]) => {
                      const isProposed = name.includes('PhishGuard-Stack')
                      return (
                        <tr
                          key={name}
                          className={isProposed ? 'bg-zinc-800/50 text-zinc-100 font-semibold' : 'text-zinc-300 hover:bg-zinc-800/20'}
                        >
                          <td className={`py-2.5 px-3 ${isProposed ? 'text-amber-400' : ''}`}>{name}</td>
                          <td className="py-2.5 px-3 text-right font-mono">{(row.accuracy * 100).toFixed(2)}%</td>
                          <td className="py-2.5 px-3 text-right font-mono">{(row.precision * 100).toFixed(2)}%</td>
                          <td className="py-2.5 px-3 text-right font-mono">{(row.recall * 100).toFixed(2)}%</td>
                          <td className="py-2.5 px-3 text-right font-mono">{row.f1_score.toFixed(4)}</td>
                          <td className="py-2.5 px-3 text-right font-mono">{row.roc_auc.toFixed(4)}</td>
                          <td className="py-2.5 px-3 text-right font-mono">{(row.fpr * 100).toFixed(2)}%</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── 9-Classifier Benchmark Table ── */}
          {metrics.all_models && (
            <div className="card p-6 sm:p-7 space-y-4">
              <div className="text-base font-semibold text-zinc-200 flex items-center gap-2">
                <Table className="w-4 h-4 text-amber-500" />
                <span>Comparison Across Nine ML Classifiers (Unseen Domains, N = 2,286)</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-400">
                      <th className="py-2.5 px-3 font-semibold">Classifier</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Acc.</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Prec.</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Rec.</th>
                      <th className="py-2.5 px-3 font-semibold text-right">F1</th>
                      <th className="py-2.5 px-3 font-semibold text-right">AUC</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Brier</th>
                      <th className="py-2.5 px-3 font-semibold text-right">ECE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {Object.entries(metrics.all_models).map(([name, m]) => {
                      const isProposed = name.includes('PhishGuard-Stack')
                      return (
                        <tr
                          key={name}
                          className={isProposed ? 'bg-zinc-800/50 text-zinc-100 font-semibold' : 'text-zinc-300 hover:bg-zinc-800/20'}
                        >
                          <td className={`py-2.5 px-3 ${isProposed ? 'text-amber-400' : ''}`}>{name}</td>
                          <td className="py-2.5 px-3 text-right font-mono">{(m.accuracy * 100).toFixed(2)}%</td>
                          <td className="py-2.5 px-3 text-right font-mono">{(m.precision * 100).toFixed(2)}%</td>
                          <td className="py-2.5 px-3 text-right font-mono">{(m.recall * 100).toFixed(2)}%</td>
                          <td className="py-2.5 px-3 text-right font-mono">{m.f1_score.toFixed(4)}</td>
                          <td className="py-2.5 px-3 text-right font-mono">{m.roc_auc.toFixed(4)}</td>
                          <td className="py-2.5 px-3 text-right font-mono">{m.brier_score.toFixed(4)}</td>
                          <td className="py-2.5 px-3 text-right font-mono">{m.ece.toFixed(4)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Zero-Shot Cross-Corpus & Live Zero-Day Generalization ── */}
          {(ebbu || openphish) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {ebbu && (
                <div className="card p-6 space-y-3">
                  <div className="text-sm sm:text-base font-semibold text-zinc-200 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-amber-500" />
                    <span>Zero-Shot Ebbu2017 (10,000 URLs)</span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Unseen domain-disjoint evaluation on Sahingoz et al. (2019):
                  </p>
                  <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                    <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-0.5">
                      <div className="text-zinc-400">Proposed Stack</div>
                      <div className="text-xl font-bold font-mono text-emerald-400">
                        {(ebbu.proposed_phishguard_stack.accuracy * 100).toFixed(2)}%
                      </div>
                      <div className="text-zinc-500 font-mono">
                        AUC {ebbu.proposed_phishguard_stack.roc_auc.toFixed(4)}
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-0.5">
                      <div className="text-zinc-400">Legacy 24f RF</div>
                      <div className="text-xl font-bold font-mono text-zinc-300">
                        {(ebbu.legacy_24feat_rf_baseline.accuracy * 100).toFixed(2)}%
                      </div>
                      <div className="text-zinc-500 font-mono">
                        AUC {ebbu.legacy_24feat_rf_baseline.roc_auc.toFixed(4)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {openphish && (
                <div className="card p-6 space-y-3">
                  <div className="text-sm sm:text-base font-semibold text-zinc-200 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-amber-500" />
                    <span>Live 2026 OpenPhish (300 Active URLs)</span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Zero-day feed ({(openphish.https_ratio_in_phishing * 100).toFixed(1)}% HTTPS) + unseen HTTPS benign slice:
                  </p>
                  <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                    <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-0.5">
                      <div className="text-zinc-400">Proposed Recall</div>
                      <div className="text-xl font-bold font-mono text-emerald-400">
                        {(openphish.zeroday_detection_rate_proposed * 100).toFixed(2)}%
                      </div>
                      <div className="text-zinc-500 font-mono">
                        Acc {(openphish.balanced_modern_slice_proposed.accuracy * 100).toFixed(2)}%
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-0.5">
                      <div className="text-zinc-400">Legacy 24f Recall</div>
                      <div className="text-xl font-bold font-mono text-zinc-300">
                        {(openphish.zeroday_detection_rate_baseline24 * 100).toFixed(2)}%
                      </div>
                      <div className="text-zinc-500 font-mono">
                        Acc {(openphish.balanced_modern_slice_baseline24.accuracy * 100).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── 7-Stage Ablation Study ── */}
          {metrics.ablation_study && metrics.ablation_study.length > 0 && (
            <div className="card p-6 sm:p-7 space-y-4">
              <div className="text-base font-semibold text-zinc-200 flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-500" />
                <span>Seven-Stage Feature &amp; Stacking Ablation Study</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-400">
                      <th className="py-2.5 px-3 font-semibold">Ablation Stage</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Acc.</th>
                      <th className="py-2.5 px-3 font-semibold text-right">F1</th>
                      <th className="py-2.5 px-3 font-semibold text-right">ROC-AUC</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Brier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {metrics.ablation_study.map((row) => {
                      const isFinal = row.stage.startsWith('A6')
                      return (
                        <tr
                          key={row.stage}
                          className={isFinal ? 'bg-zinc-800/50 text-zinc-100 font-semibold' : 'text-zinc-300 hover:bg-zinc-800/20'}
                        >
                          <td className={`py-2.5 px-3 ${isFinal ? 'text-amber-400' : ''}`}>{row.stage}</td>
                          <td className="py-2.5 px-3 text-right font-mono">{(row.accuracy * 100).toFixed(2)}%</td>
                          <td className="py-2.5 px-3 text-right font-mono">{row.f1_score.toFixed(4)}</td>
                          <td className="py-2.5 px-3 text-right font-mono">{row.roc_auc.toFixed(4)}</td>
                          <td className="py-2.5 px-3 text-right font-mono">{row.brier_score.toFixed(4)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Feature Importances ── */}
          {metrics.feature_importances && Object.keys(metrics.feature_importances).length > 0 && (
            <div className="card p-6 sm:p-7 space-y-4">
              <div className="text-base font-semibold text-zinc-200 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-500" />
                <span>Top Predictive Features (Hybrid Attribution Sensitivity)</span>
              </div>
              <div className="space-y-3">
                {Object.entries(metrics.feature_importances).slice(0, 10).map(([k, v]) => (
                  <div key={k} className="space-y-1">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="font-mono text-zinc-300 font-medium">{k}</span>
                      <span className="font-mono text-amber-400 font-semibold">{(v * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-amber-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.max(4, v * 100 * 8))}%` }}
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
