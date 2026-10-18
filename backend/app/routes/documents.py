import logging
import time
from typing import Optional
from fastapi import APIRouter, File, HTTPException, Query, UploadFile

from backend.app.database import get_db_connection, log_activity
from backend.app.models.schemas import (
    DocumentAskRequest,
    DocumentAskResponse,
    DocumentDetailResponse,
    DocumentItem,
    DocumentListResponse,
    DocumentSummaryRequest,
    DocumentSummaryResponse,
)
from backend.app.services.document_service import DocumentService
from backend.app.services.model_manager import ModelManager
from backend.app.services.rag_service import RAGService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/documents", tags=["documents"])


@router.post("/upload", response_model=DocumentItem)
async def upload_document(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename must be provided.")

    try:
        content = await file.read()
        doc_id, item = DocumentService.save_and_index_document(file.filename, content)
        return item
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process document: {str(e)}")


@router.get("", response_model=DocumentListResponse)
async def list_documents():
    docs = DocumentService.list_documents()
    return DocumentListResponse(documents=docs, total=len(docs))


@router.get("/{document_id}", response_model=DocumentDetailResponse)
async def get_document(document_id: str):
    doc = DocumentService.get_document(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    return DocumentDetailResponse(
        id=doc["id"],
        filename=doc["filename"],
        original_name=doc["original_name"],
        file_size_kb=doc["file_size_kb"],
        file_type=doc["file_type"],
        page_count=doc["page_count"],
        char_count=doc["char_count"],
        summary=doc["summary"],
        created_at=doc["created_at"],
        indexed=bool(doc["indexed"]),
        extracted_text=doc["extracted_text"] or "",
    )


@router.post("/{document_id}/summarize", response_model=DocumentSummaryResponse)
async def summarize_document(document_id: str, req: Optional[DocumentSummaryRequest] = None):
    doc = DocumentService.get_document(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    manager = ModelManager.get_instance()
    provider = manager.get_active_provider()

    focus_instruction = "Provide a comprehensive executive summary."
    if req and req.focus:
        focus_instruction = f"Focus particularly on {req.focus} aspects of the document."

    prompt = (
        f"Summarize the following document accurately. {focus_instruction}\n"
        "Highlight the most critical 3-5 takeaways.\n\n"
        f"Document Content:\n{doc['extracted_text'][:6000]}\n\n"
        "Format as clean markdown with an Executive Summary paragraph followed by bullet points."
    )

    start = time.time()
    summary_text = await provider.generate(
        prompt=prompt,
        system_prompt="You are an expert document summarizer. Ground all insights directly in the text.",
        temperature=0.2,
    )
    elapsed = round(time.time() - start, 2)

    # Save summary back to DB
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE documents SET summary = ? WHERE id = ?", (summary_text, document_id))
        conn.commit()

    log_activity(
        "summary",
        f"Summarized {doc['original_name']}",
        f"Generated summary using {provider.provider_name()} ({elapsed}s)",
    )

    # Extract bullet points if present
    bullets = [line.strip().lstrip("-*• ") for line in summary_text.split("\n") if line.strip().startswith(("-", "*", "•"))]

    return DocumentSummaryResponse(
        document_id=document_id,
        summary=summary_text,
        bullet_points=bullets[:6],
        model_used=provider.provider_name(),
        processing_time_sec=elapsed,
    )


@router.post("/ask", response_model=DocumentAskResponse)
async def ask_document(req: DocumentAskRequest):
    manager = ModelManager.get_instance()
    provider = manager.get_active_provider()
    rag = RAGService(provider)

    return await rag.answer_question(
        question=req.question,
        document_id=req.document_id,
        top_k=req.top_k,
    )


@router.delete("/{document_id}")
async def delete_document(document_id: str):
    success = DocumentService.delete_document(document_id)
    if not success:
        raise HTTPException(status_code=404, detail="Document not found.")
    return {"message": "Document deleted successfully.", "id": document_id}
