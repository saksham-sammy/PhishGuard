// Shared TypeScript types across the frontend

export type RiskCategory = 'high' | 'medium' | 'low'
export type PredictedClass = 'phishing' | 'legitimate'
export type ActivePage = 'scanner' | 'dashboard' | 'history' | 'about'

export interface ScanResult {
  request_id: string
  url: string
  predicted_class: PredictedClass
  label: number
  probability: number | null
  risk_category: RiskCategory
  features: Record<string, number | boolean>
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

export interface ModelMetrics {
  available: boolean
  model_name?: string
  dataset_source?: string
  dataset_rows?: number
  train_size?: number
  test_size?: number
  accuracy?: number
  precision?: number
  recall?: number
  f1_score?: number
  confusion_matrix?: number[][]
  class_labels?: string[]
  feature_importances?: Record<string, number>
  note?: string
}
