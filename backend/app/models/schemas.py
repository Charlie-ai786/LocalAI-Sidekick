from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel, Field


class DocumentItem(BaseModel):
    id: str
    filename: str
    original_name: str
    file_size_kb: float
    file_type: str
    page_count: int
    char_count: int
    summary: Optional[str] = None
    created_at: str
    indexed: bool = False


class DocumentListResponse(BaseModel):
    documents: list[DocumentItem]
    total: int


class DocumentDetailResponse(DocumentItem):
    extracted_text: str


class DocumentSummaryRequest(BaseModel):
    document_id: str
    focus: Optional[str] = "general"  # executive, action_items, key_facts, financial


class DocumentSummaryResponse(BaseModel):
    document_id: str
    summary: str
    bullet_points: list[str] = []
    model_used: str
    processing_time_sec: float


class DocumentAskRequest(BaseModel):
    document_id: Optional[str] = None  # None means search across all indexed documents
    question: str
    use_rag: bool = True
    top_k: int = 4


class SourceCitation(BaseModel):
    document_id: str
    document_name: str
    page_number: Optional[int] = 1
    snippet: str
    relevance_score: float


class DocumentAskResponse(BaseModel):
    answer: str
    sources: list[SourceCitation] = []
    found_in_source: bool
    model_used: str
    latency_sec: float


class InvoiceRecord(BaseModel):
    id: str
    document_id: Optional[str] = None
    merchant: str
    invoice_date: Optional[str] = None
    total_amount: Optional[float] = None
    currency: str = "USD"
    tax_amount: Optional[float] = None
    invoice_number: Optional[str] = None
    category: str = "General Business"
    needs_review: bool = False
    review_reasons: list[str] = []
    confidence_score: float = 1.0
    notes: Optional[str] = ""
    created_at: str


class InvoiceUpdateRequest(BaseModel):
    merchant: Optional[str] = None
    invoice_date: Optional[str] = None
    total_amount: Optional[float] = None
    currency: Optional[str] = None
    tax_amount: Optional[float] = None
    invoice_number: Optional[str] = None
    category: Optional[str] = None
    needs_review: Optional[bool] = None
    notes: Optional[str] = None


class StudioGenerateRequest(BaseModel):
    template: str  # product_description, client_email, proposal, social_caption, service_description, marketing_copy
    topic: str
    target_audience: Optional[str] = "General"
    tone: str = "Professional"  # Professional, Friendly, Persuasive, Bold, Urgent, Casual
    language: str = "English"
    length: str = "Medium"  # Short, Medium, Long
    key_points: Optional[str] = None


class StudioGenerateResponse(BaseModel):
    content: str
    template: str
    model_used: str
    latency_sec: float
    created_at: str


class SearchResultItem(BaseModel):
    document_id: str
    document_name: str
    page_number: int
    snippet: str
    match_score: float
    match_type: str  # semantic or keyword


class SearchResponse(BaseModel):
    query: str
    results: list[SearchResultItem]
    total_matches: int


class ModelInfo(BaseModel):
    name: str
    tag: str
    size_gb: float
    parameter_size: str
    family: str
    installed: bool = False
    recommended_vram: str = "4GB"
    description: str = ""
    license: str = ""


class ModelStatusResponse(BaseModel):
    ollama_running: bool
    ollama_url: str
    current_model: str
    active_provider: str  # "ollama_local" or "demo_fallback"
    is_local_inference: bool
    installed_models: list[ModelInfo]
    compatible_catalog: list[ModelInfo]
    demo_mode_active: bool
    message: str


class ActivityLogItem(BaseModel):
    id: str
    activity_type: str  # document_upload, summary, rag_query, invoice_extraction, studio_generate
    title: str
    description: str
    timestamp: str
    status: str = "success"


class DashboardStats(BaseModel):
    total_documents: int
    total_invoices: int
    total_expenses: float
    needs_review_count: int
    storage_used_mb: float
    recent_activities: list[ActivityLogItem]
    expenses_by_category: dict[str, float]
    monthly_expenses: list[dict[str, Any]]
    model_status: dict[str, Any]


class DevRelayAuthor(BaseModel):
    name: str
    username: str
    profile_image: str = ""


class DevRelayArticleItem(BaseModel):
    id: int
    title: str
    description: Optional[str] = ""
    url: str
    cover_image: Optional[str] = None
    published_at: Optional[str] = None
    readable_publish_date: Optional[str] = None
    tag_list: list[str] = []
    reading_time_minutes: int = 1
    positive_reactions_count: int = 0
    comments_count: int = 0
    user: DevRelayAuthor


class DevRelayArticleDetail(DevRelayArticleItem):
    body_markdown: Optional[str] = None


class DevRelayPublishRequest(BaseModel):
    title: str
    body_markdown: str
    tags: list[str] = ["ai", "opensource"]
    published: bool = False
    api_key: Optional[str] = None


class DevRelayPublishResponse(BaseModel):
    success: bool
    message: str
    article_id: Optional[int] = None
    title: Optional[str] = None
    url: Optional[str] = None
    edit_url: Optional[str] = None
    published: bool = False


class DevRelayPromptItem(BaseModel):
    id: str
    title: str
    category: str
    description: str
    prompt: str
    recommended_model: str = "qwen2.5:3b"
