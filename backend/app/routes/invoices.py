import logging
from typing import List, Optional
from fastapi import APIRouter, File, HTTPException, Response, UploadFile

from backend.app.models.schemas import InvoiceRecord, InvoiceUpdateRequest
from backend.app.services.document_service import DocumentService
from backend.app.services.invoice_service import InvoiceService
from backend.app.services.model_manager import ModelManager

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/invoices", tags=["invoices"])


@router.post("/process", response_model=InvoiceRecord)
async def process_invoice(
    file: Optional[UploadFile] = File(None),
    document_id: Optional[str] = None,
):
    """Processes an invoice either directly from a new upload or from an existing document."""
    manager = ModelManager.get_instance()
    provider = manager.get_active_provider()
    invoice_svc = InvoiceService(provider)

    doc_text = ""
    filename = "Uploaded File"
    target_doc_id = document_id

    if file and file.filename:
        content = await file.read()
        target_doc_id, item = DocumentService.save_and_index_document(file.filename, content)
        doc = DocumentService.get_document(target_doc_id)
        if doc:
            doc_text = doc["extracted_text"]
            filename = file.filename
    elif document_id:
        doc = DocumentService.get_document(document_id)
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found.")
        doc_text = doc["extracted_text"]
        filename = doc["original_name"]
    else:
        raise HTTPException(status_code=400, detail="Must provide either a file upload or document_id.")

    return await invoice_svc.extract_and_save_invoice(
        document_id=target_doc_id,
        text=doc_text,
        filename=filename,
    )


@router.get("", response_model=List[InvoiceRecord])
async def list_invoices():
    return InvoiceService.list_invoices()


@router.get("/export/csv")
async def export_invoices_csv():
    csv_data = InvoiceService.export_csv()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=localai_invoices.csv"},
    )


@router.get("/{invoice_id}", response_model=InvoiceRecord)
async def get_invoice(invoice_id: str):
    inv = InvoiceService.get_invoice_by_id(invoice_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice record not found.")
    return inv


@router.put("/{invoice_id}", response_model=InvoiceRecord)
async def update_invoice(invoice_id: str, updates: InvoiceUpdateRequest):
    inv = InvoiceService.update_invoice(invoice_id, updates)
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice record not found.")
    return inv


@router.delete("/{invoice_id}")
async def delete_invoice(invoice_id: str):
    success = InvoiceService.delete_invoice(invoice_id)
    if not success:
        raise HTTPException(status_code=404, detail="Invoice record not found.")
    return {"message": "Invoice deleted successfully.", "id": invoice_id}
