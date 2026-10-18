export interface DocumentItem {
  id: string;
  filename: string;
  original_name: string;
  file_size_kb: number;
  file_type: string;
  page_count: number;
  char_count: number;
  summary?: string | null;
  created_at: string;
  indexed: boolean;
}

export interface DocumentDetail extends DocumentItem {
  extracted_text: string;
}

export interface SourceCitation {
  document_id: string;
  document_name: string;
  page_number: number;
  snippet: string;
  relevance_score: number;
}

export interface DocumentAskResponse {
  answer: string;
  sources: SourceCitation[];
  found_in_source: boolean;
  model_used: string;
  latency_sec: number;
}

export interface InvoiceRecord {
  id: string;
  document_id?: string | null;
  merchant: string;
  invoice_date?: string | null;
  total_amount?: number | null;
  currency: string;
  tax_amount?: number | null;
  invoice_number?: string | null;
  category: string;
  needs_review: boolean;
  review_reasons: string[];
  confidence_score: number;
  notes?: string;
  created_at: string;
}

export interface StudioTemplate {
  id: string;
  title: string;
  description: string;
  icon: string;
  default_topic: string;
  default_points: string;
}

export interface StudioGenerateResponse {
  content: string;
  template: string;
  model_used: string;
  latency_sec: number;
  created_at: string;
}

export interface SearchResultItem {
  document_id: string;
  document_name: string;
  page_number: number;
  snippet: string;
  match_score: number;
  match_type: 'semantic' | 'keyword';
}

export interface SearchResponse {
  query: string;
  results: SearchResultItem[];
  total_matches: number;
}

export interface ModelInfo {
  name: string;
  tag: string;
  size_gb: number;
  parameter_size: string;
  family: string;
  installed: boolean;
  recommended_vram: string;
  description: string;
  license: string;
}

export interface ModelStatus {
  ollama_running: boolean;
  ollama_url: string;
  current_model: string;
  active_provider: string;
  is_local_inference: boolean;
  installed_models: ModelInfo[];
  compatible_catalog: ModelInfo[];
  demo_mode_active: boolean;
  message: string;
}

export interface ActivityLogItem {
  id: string;
  activity_type: string;
  title: string;
  description: string;
  timestamp: string;
  status: string;
}

export interface DashboardStats {
  total_documents: number;
  total_invoices: number;
  total_expenses: number;
  needs_review_count: number;
  storage_used_mb: number;
  recent_activities: ActivityLogItem[];
  expenses_by_category: Record<string, number>;
  monthly_expenses: { month: string; amount: number }[];
  model_status: {
    ollama_running: boolean;
    current_model: string;
    active_provider: string;
    is_local_inference: boolean;
    demo_mode_active: boolean;
  };
}
