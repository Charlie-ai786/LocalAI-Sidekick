import {
  DashboardStats,
  DocumentDetail,
  DocumentItem,
  DocumentAskResponse,
  InvoiceRecord,
  ModelStatus,
  SearchResponse,
  StudioGenerateResponse,
  StudioTemplate,
} from '../types';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '') + '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errDetail = 'Request failed';
    try {
      const err = await res.json();
      errDetail = err.detail || err.message || JSON.stringify(err);
    } catch {
      errDetail = await res.text();
    }
    throw new Error(errDetail || `HTTP error ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    const res = await fetch(`${API_BASE}/dashboard/stats`);
    return handleResponse<DashboardStats>(res);
  },

  // Documents
  async getDocuments(): Promise<{ documents: DocumentItem[]; total: number }> {
    const res = await fetch(`${API_BASE}/documents`);
    return handleResponse<{ documents: DocumentItem[]; total: number }>(res);
  },

  async getDocumentDetail(id: string): Promise<DocumentDetail> {
    const res = await fetch(`${API_BASE}/documents/${id}`);
    return handleResponse<DocumentDetail>(res);
  },

  async uploadDocument(file: File): Promise<DocumentItem> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse<DocumentItem>(res);
  },

  async summarizeDocument(id: string, focus?: string): Promise<{ summary: string; bullet_points: string[] }> {
    const res = await fetch(`${API_BASE}/documents/${id}/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document_id: id, focus: focus || 'general' }),
    });
    return handleResponse<{ summary: string; bullet_points: string[] }>(res);
  },

  async askDocument(question: string, documentId?: string): Promise<DocumentAskResponse> {
    const res = await fetch(`${API_BASE}/documents/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question,
        document_id: documentId || null,
        use_rag: true,
        top_k: 4,
      }),
    });
    return handleResponse<DocumentAskResponse>(res);
  },

  async deleteDocument(id: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/documents/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<{ message: string }>(res);
  },

  // Invoices
  async getInvoices(): Promise<InvoiceRecord[]> {
    const res = await fetch(`${API_BASE}/invoices`);
    return handleResponse<InvoiceRecord[]>(res);
  },

  async processInvoice(file?: File, documentId?: string): Promise<InvoiceRecord> {
    const formData = new FormData();
    if (file) {
      formData.append('file', file);
    }
    const url = documentId
      ? `${API_BASE}/invoices/process?document_id=${encodeURIComponent(documentId)}`
      : `${API_BASE}/invoices/process`;
    const res = await fetch(url, {
      method: 'POST',
      body: file ? formData : undefined,
    });
    return handleResponse<InvoiceRecord>(res);
  },

  async updateInvoice(id: string, updates: Partial<InvoiceRecord>): Promise<InvoiceRecord> {
    const res = await fetch(`${API_BASE}/invoices/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return handleResponse<InvoiceRecord>(res);
  },

  async deleteInvoice(id: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/invoices/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<{ message: string }>(res);
  },

  getExportCsvUrl(): string {
    return `${API_BASE}/invoices/export/csv`;
  },

  // Business Content Studio
  async getStudioTemplates(): Promise<StudioTemplate[]> {
    const res = await fetch(`${API_BASE}/studio/templates`);
    return handleResponse<StudioTemplate[]>(res);
  },

  async generateContent(data: {
    template: string;
    topic: string;
    target_audience?: string;
    tone: string;
    language: string;
    length: string;
    key_points?: string;
  }): Promise<StudioGenerateResponse> {
    const res = await fetch(`${API_BASE}/studio/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<StudioGenerateResponse>(res);
  },

  // Search
  async search(query: string): Promise<SearchResponse> {
    const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
    return handleResponse<SearchResponse>(res);
  },

  // Models
  async getModelStatus(): Promise<ModelStatus> {
    const res = await fetch(`${API_BASE}/models/status`);
    return handleResponse<ModelStatus>(res);
  },

  async selectModel(modelTag: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/models/select`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model_tag: modelTag }),
    });
    return handleResponse<{ message: string }>(res);
  },

  async toggleDemoMode(enabled: boolean): Promise<{ message: string; demo_mode: boolean }> {
    const res = await fetch(`${API_BASE}/models/demo-mode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    });
    return handleResponse<{ message: string; demo_mode: boolean }>(res);
  },
};
