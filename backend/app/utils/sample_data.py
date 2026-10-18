import json
import logging
from pathlib import Path
from backend.app.config import settings
from backend.app.database import get_db_connection, init_db
from backend.app.services.document_service import DocumentService
from backend.app.services.invoice_service import InvoiceService
from backend.app.services.model_manager import ModelManager

logger = logging.getLogger(__name__)

SAMPLE_DIR = settings.data_dir / "samples"
SAMPLE_DIR.mkdir(parents=True, exist_ok=True)


def create_sample_pdf(file_path: Path, title: str, pages_content: list[str]) -> None:
    """Creates a genuine, valid multi-page PDF using PyMuPDF."""
    try:
        try:
            import pymupdf as fitz
        except ImportError:
            import fitz
        doc = fitz.open()
        for i, text in enumerate(pages_content):
            page = doc.new_page()
            # Title header
            page.insert_text((50, 50), title, fontsize=16, color=(0.1, 0.2, 0.5))
            page.insert_text((50, 75), f"Page {i + 1} of {len(pages_content)}", fontsize=9, color=(0.5, 0.5, 0.5))
            # Text body
            page.insert_textbox(fitz.Rect(50, 95, 550, 750), text, fontsize=11, fontname="helv")
        doc.save(str(file_path))
        doc.close()
    except Exception as e:
        logger.warning(f"Could not use PyMuPDF to create PDF, writing fallback text: {e}")
        file_path.with_suffix(".txt").write_text("\n\n".join(pages_content), encoding="utf-8")


def seed_sample_data_if_empty() -> None:
    """Populates synthetic initial documents and invoices if the database is brand new."""
    init_db()

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as count FROM documents")
        doc_count = cursor.fetchone()["count"]

    if doc_count > 0:
        return  # Already seeded or has data

    logger.info("Database is empty. Seeding realistic sample documents and invoices...")

    # 1. Sample Contract PDF
    contract_p1 = (
        "MASTER SERVICES AGREEMENT\n\n"
        "This Master Services Agreement ('Agreement') is entered into as of January 15, 2026, "
        "by and between Nova Systems Inc. ('Client') and LocalAI Sidekick Studio ('Consultant').\n\n"
        "1. SCOPE OF SERVICES\n"
        "Consultant agrees to provide privacy-first local artificial intelligence workflows, "
        "including document retrieval-augmented generation (RAG), automated receipt processing, "
        "and offline LLM pipeline integration.\n\n"
        "2. DATA PRIVACY & COMPLIANCE\n"
        "All client data, financial invoices, source documents, and embeddings shall remain strictly "
        "on on-premise hardware. No client records shall be transmitted to third-party hosted APIs.\n\n"
        "3. INTELLECTUAL PROPERTY\n"
        "All custom models, fine-tuned weights, and custom scripts created specifically for the Client "
        "shall be the sole property of the Client upon settlement of invoices."
    )
    contract_p2 = (
        "4. COMPENSATION & PAYMENT TERMS\n"
        "The project retainer is established at $4,500.00 USD payable in bi-weekly disbursements. "
        "Invoices are payable within 15 days of receipt via direct bank wire.\n\n"
        "5. TERMINATION CLAUSE\n"
        "Either party may terminate this Agreement with 14 calendar days written notice. "
        "In the event of termination, Consultant will be paid for all verifiable deliverables completed to date.\n\n"
        "Signatures:\n"
        "For Nova Systems Inc: Jordan Vance, CTO\n"
        "For LocalAI Sidekick Studio: Lead AI Architect"
    )
    contract_path = SAMPLE_DIR / "sample_master_services_agreement.pdf"
    create_sample_pdf(contract_path, "Master Services Agreement", [contract_p1, contract_p2])

    # 2. Sample Cloud Hosting Invoice PDF
    inv1_text = (
        "INVOICE\n\n"
        "Vendor: Apex Cloud Infrastructure LLC\n"
        "100 Enterprise Way, Suite 400, Austin, TX 78701\n"
        "Invoice Number: INV-2026-8841\n"
        "Invoice Date: 2026-03-01\n"
        "Due Date: 2026-03-15\n\n"
        "Billed To:\n"
        "LocalAI Freelance Studio\n\n"
        "Line Items:\n"
        "1. Dedicated GPU Inference Instance (A10G, 744 hours) - $410.00\n"
        "2. Encrypted NVMe Storage Volume (500GB) - $40.00\n"
        "Subtotal: $450.00\n"
        "Sales Tax (7.88%): $35.50\n"
        "Total Amount Due: $485.50 USD\n\n"
        "Status: Paid via Corporate Card ending in 4092."
    )
    inv1_path = SAMPLE_DIR / "apex_cloud_invoice.pdf"
    create_sample_pdf(inv1_path, "Apex Cloud Infrastructure - Invoice INV-2026-8841", [inv1_text])

    # 3. Sample Hardware Invoice PDF
    inv2_text = (
        "SALES RECEIPT & TAX INVOICE\n\n"
        "Merchant: MicroCenter Hardware Depot\n"
        "Receipt #: REC-99214\n"
        "Date: 2026-02-18\n\n"
        "Customer: Self-Employed Developer\n\n"
        "Item: Workstation Mini PC - AMD Ryzen 9 7900, 64GB DDR5, 2TB PCIe 4.0 SSD\n"
        "Quantity: 1\n"
        "Unit Price: $1,199.00\n"
        "Subtotal: $1,199.00\n"
        "Tax (State & Local): $100.00\n"
        "Total: $1,299.00 USD\n\n"
        "Payment Method: Visa Debit (Approved)"
    )
    inv2_path = SAMPLE_DIR / "microcenter_hardware_receipt.pdf"
    create_sample_pdf(inv2_path, "MicroCenter Hardware Depot - Receipt", [inv2_text])

    # 4. Sample SaaS Product Vision Text
    doc3_text = (
        "# LocalAI Sidekick: Product Vision & Architecture\n\n"
        "## Overview\n"
        "LocalAI Sidekick is designed from the ground up to solve 'API credit fatigue' and data privacy concerns "
        "for modern knowledge workers, freelancers, and small businesses.\n\n"
        "## Economic Feasibility\n"
        "Traditional SaaS AI tools charge $20 to $50 monthly or meter every token through OpenAI or Anthropic. "
        "For small teams processing thousands of invoices and PDFs, costs escalate rapidly. "
        "By utilizing modern open-weight models (Qwen 2.5 3B, Gemma 2 2B) through local inference (Ollama), "
        "operational marginal cost per query is exactly $0.00.\n\n"
        "## Core Capabilities\n"
        "- PDF Intelligence: Instant text extraction with exact page references.\n"
        "- Invoice Ledger: Automatic detection of merchant, date, total, and tax with manual review flagging.\n"
        "- Business Studio: Copywriting and proposal drafting with tone and length adjustments.\n"
        "- Semantic Search: Local vector embeddings without sending documents to cloud vector DBs."
    )
    doc3_path = SAMPLE_DIR / "localai_product_vision.txt"
    doc3_path.write_text(doc3_text, encoding="utf-8")

    # Index sample files into DocumentService
    for p in [contract_path, inv1_path, inv2_path, doc3_path]:
        if p.exists():
            content = p.read_bytes()
            doc_id, item = DocumentService.save_and_index_document(p.name, content)

    # Pre-populate invoices in SQLite
    manager = ModelManager.get_instance()
    inv_svc = InvoiceService(manager.get_active_provider())

    # Seed invoice 1
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO invoices (
                id, merchant, invoice_date, total_amount, currency, tax_amount,
                invoice_number, category, needs_review, review_reasons, confidence_score,
                notes, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                "inv-demo-001",
                "Apex Cloud Infrastructure LLC",
                "2026-03-01",
                485.50,
                "USD",
                35.50,
                "INV-2026-8841",
                "Utilities & Hosting",
                0,
                "[]",
                0.98,
                "Verified GPU instance charges for March 2026",
                "2026-03-01T10:00:00",
            ),
        )
        # Seed invoice 2
        cursor.execute(
            """
            INSERT INTO invoices (
                id, merchant, invoice_date, total_amount, currency, tax_amount,
                invoice_number, category, needs_review, review_reasons, confidence_score,
                notes, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                "inv-demo-002",
                "MicroCenter Hardware Depot",
                "2026-02-18",
                1299.00,
                "USD",
                100.00,
                "REC-99214",
                "Hardware & Equipment",
                0,
                "[]",
                0.95,
                "New Ryzen development workstation for local AI inference",
                "2026-02-18T14:30:00",
            ),
        )
        # Seed invoice 3 (Flagged for review)
        cursor.execute(
            """
            INSERT INTO invoices (
                id, merchant, invoice_date, total_amount, currency, tax_amount,
                invoice_number, category, needs_review, review_reasons, confidence_score,
                notes, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                "inv-demo-003",
                "Airport Taxi & Transit Express",
                "2026-03-10",
                74.20,
                "USD",
                None,
                None,
                "Travel & Transport",
                1,
                json.dumps(["No invoice number found on printed receipt."]),
                0.78,
                "Client on-site consultation transit receipt",
                "2026-03-10T19:15:00",
            ),
        )
        conn.commit()

    logger.info("Sample documents and invoices successfully seeded.")
