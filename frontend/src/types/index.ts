// Shared TypeScript types across the PhishGuard-Stack frontend

export type RiskCategory = 'high' | 'medium' | 'low'
export type PredictedClass = 'phishing' | 'legitimate'
export type ActivePage = 'scanner' | 'dashboard' | 'history' | 'about'

export interface FeatureAttributionItem {
  feature: string
  value: number
  benign_baseline: number
  contribution: number
  direction: 'increases_risk' | 'reduces_risk' | string
}

export interface ScanResult {
  request_id: string
  url: string
  predicted_class: PredictedClass
  label: number
  probability: number | null
  risk_category: RiskCategory
  features: Record<string, number | boolean>
  feature_attributions?: FeatureAttributionItem[] | null
  ensemble_breakdown?: Record<string, number> | null
  warnings: string[]
  explanation: string
  disclaimer: string
  scanned_at: string
}

export interface HistoryEntry {
  id: number
  url_display: string
  predicted_class: PredictedClass
  risk_category: RiskCategory
  probability: number | null
  scanned_at: string
}

export interface AblationStage {
  stage: string
  feature_count: number
  accuracy: number
  precision: number
  recall: number
  f1_score: number
  roc_auc: number
  brier_score: number
  ece?: number
}

export interface ModelMetrics {
  available: boolean
  model_name?: string
  dataset_source?: string
  partition_protocol?: string
  dataset_rows?: number
  unique_domains?: number
  train_size?: number
  test_size?: number
  feature_count?: number
  accuracy?: number
  precision?: number
  recall?: number
  f1_score?: number
  roc_auc?: number
  pr_auc?: number
  brier_score?: number
  ece?: number
  fpr?: number
  fnr?: number
  confusion_matrix?: number[][]
  class_labels?: string[]
  bootstrap_95ci?: Record<string, number[]>
  cv_5fold?: {
    n_folds: number
    partition_protocol: string
    mean: Record<string, number>
    std: Record<string, number>
  }
  feature_importances?: Record<string, number>
  all_models?: Record<string, Record<string, any>>
  baseline_comparison?: Record<string, Record<string, any>>
  ablation_study?: AblationStage[]
  ood_benchmarks?: Record<string, any>
  note?: string
}
