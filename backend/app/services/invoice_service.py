import csv
import io
import json
import logging
import re
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from backend.app.database import get_db_connection, log_activity
from backend.app.models.schemas import InvoiceRecord, InvoiceUpdateRequest
from backend.app.providers.base import BaseLLMProvider

logger = logging.getLogger(__name__)

EXPENSE_CATEGORIES = [
    "Software & Subscriptions",
    "Office & Workspace",
    "Hardware & Equipment",
    "Travel & Transport",
    "Meals & Entertainment",
    "Professional & Legal",
    "Marketing & Ads",
    "Utilities & Hosting",
    "General Business",
]


class InvoiceService:
    def __init__(self, provider: BaseLLMProvider):
        self.provider = provider

    @staticmethod
    def _rule_based_extract(text: str) -> Dict[str, Any]:
        """High-precision regex heuristics to extract financial fields without hallucination."""
        # Currency
        currency = "USD"
        if "€" in text or "EUR" in text:
            currency = "EUR"
        elif "£" in text or "GBP" in text:
            currency = "GBP"
        elif "₹" in text or "INR" in text:
            currency = "INR"
        elif "C$" in text or "CAD" in text:
            currency = "CAD"

        # Invoice number pattern
        inv_num = None
        inv_match = re.search(r"(?:invoice|inv|bill|receipt)\s*(?:#|no\.?|num\.?)?\s*[:\-]?\s*([A-Za-z0-9\-_]{3,20})", text, re.IGNORECASE)
        if inv_match:
            inv_num = inv_match.group(1).strip()

        # Date pattern (YYYY-MM-DD, MM/DD/YYYY, DD Mon YYYY)
        date_str = None
        date_match = re.search(r"(?:date|dated|issued)\s*[:\-]?\s*([0-9]{4}[-/][0-9]{2}[-/][0-9]{2}|[0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{2,4}|[A-Za-z]{3,9}\s+[0-9]{1,2},?\s+[0-9]{4})", text, re.IGNORECASE)
        if date_match:
            date_str = date_match.group(1).strip()
        else:
            # Try plain ISO date
            plain_date = re.search(r"\b(20[2-3][0-9]-[0-1][0-9]-[0-3][0-9])\b", text)
            if plain_date:
                date_str = plain_date.group(1)

        # Total amount pattern (ensure we do not match 'subtotal')
        total_val = None
        # Look for explicit grand total or final total
        total_matches = re.findall(
            r"(?<!sub)(?<!sub-)(?<!sub\s)\b(?:total|amount\s+due|balance\s+due|grand\s+total)\b\s*[:\-]?\s*[$€£₹]?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2}))",
            text,
            re.IGNORECASE,
        )
        if total_matches:
            try:
                # The last matching total is often the final total (subtotal comes earlier)
                total_val = float(total_matches[-1].replace(",", ""))
            except Exception:
                pass

        # Tax amount pattern
        tax_val = None
        tax_match = re.search(r"(?:tax|vat|gst|sales\s+tax)\s*[:\-]?\s*[$€£₹]?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2}))", text, re.IGNORECASE)
        if tax_match:
            try:
                tax_val = float(tax_match.group(1).replace(",", ""))
            except Exception:
                pass

        # Merchant guess from first few non-empty lines
        merchant = "Unknown Merchant"
        lines = [l.strip() for l in text.split("\n") if len(l.strip()) > 2]
        for line in lines[:5]:
            if not re.search(r"invoice|receipt|bill|statement|tax\s+invoice", line, re.IGNORECASE):
                # Good candidate for merchant name
                clean_name = re.sub(r"[^\w\s\.,&]", "", line)[:40].strip()
                if clean_name:
                    merchant = clean_name
                    break

        return {
            "merchant": merchant,
            "invoice_date": date_str,
            "total_amount": total_val,
            "currency": currency,
            "tax_amount": tax_val,
            "invoice_number": inv_num,
        }

    async def extract_and_save_invoice(
        self,
        document_id: Optional[str],
        text: str,
        filename: Optional[str] = None,
    ) -> InvoiceRecord:
        """Extracts structured invoice fields combining rules and LLM JSON extraction."""
        # 1. Start with rule-based heuristics to guarantee no invented values
        rule_data = self._rule_based_extract(text)

        # 2. Use LLM prompt for intelligent categorization and refinement
        prompt = (
            "You are an accountant document parser. Extract the following financial fields in strictly valid JSON.\n"
            "CRITICAL: If a total or date cannot be determined with certainty, set it to null. NEVER INVENT OR FABRICATE VALUES.\n\n"
            "Fields to extract:\n"
            "- merchant (string)\n"
            "- invoice_date (YYYY-MM-DD or string, or null)\n"
            "- total_amount (number or null)\n"
            "- currency (3-letter currency code, e.g. USD, EUR, GBP)\n"
            "- tax_amount (number or null)\n"
            "- invoice_number (string or null)\n"
            f"- category (one of: {', '.join(EXPENSE_CATEGORIES)})\n"
            "- confidence_score (number between 0.0 and 1.0)\n\n"
            f"Document Text:\n{text[:4000]}\n\n"
            "Return ONLY the JSON object, with no markdown code fence or extra text."
        )

        llm_response = await self.provider.generate(prompt=prompt, temperature=0.1)

        # Parse LLM output
        llm_data = {}
        try:
            cleaned = llm_response.strip()
            if "```" in cleaned:
                cleaned = re.sub(r"```json\s*|```", "", cleaned).strip()
            llm_data = json.loads(cleaned)
        except Exception as e:
            logger.warning(f"Could not parse LLM JSON invoice output, using heuristics: {e}")

        # Merge results, prioritizing non-null validated fields
        merchant = llm_data.get("merchant") or rule_data.get("merchant") or "Unspecified Vendor"
        inv_date = llm_data.get("invoice_date") or rule_data.get("invoice_date")
        total = llm_data.get("total_amount")
        if total is None:
            total = rule_data.get("total_amount")

        currency = llm_data.get("currency") or rule_data.get("currency") or "USD"
        tax = llm_data.get("tax_amount")
        if tax is None:
            tax = rule_data.get("tax_amount")

        inv_num = llm_data.get("invoice_number") or rule_data.get("invoice_number")
        category = llm_data.get("category")
        if category not in EXPENSE_CATEGORIES:
            category = "General Business"

        # Determine review reasons and confidence
        review_reasons = []
        if total is None or total <= 0:
            review_reasons.append("Missing or zero total amount detected.")
        if not inv_date:
            review_reasons.append("Invoice date could not be verified.")
        if merchant in ("Unknown Merchant", "Unspecified Vendor"):
            review_reasons.append("Vendor/Merchant name uncertain.")
        if not inv_num:
            review_reasons.append("No invoice number found.")

        needs_review = len(review_reasons) > 0
        confidence = round(1.0 - (len(review_reasons) * 0.2), 2)
        confidence = max(0.2, min(1.0, confidence))

        record_id = str(uuid.uuid4())
        created_at = datetime.now(timezone.utc).isoformat()

        # Save to SQLite
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO invoices (
                    id, document_id, merchant, invoice_date, total_amount, currency,
                    tax_amount, invoice_number, category, needs_review, review_reasons,
                    confidence_score, notes, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    record_id,
                    document_id,
                    merchant,
                    inv_date,
                    total,
                    currency,
                    tax,
                    inv_num,
                    category,
                    1 if needs_review else 0,
                    json.dumps(review_reasons),
                    confidence,
                    f"Processed from {filename or 'document'}",
                    created_at,
                ),
            )
            conn.commit()

        log_activity(
            "invoice_extraction",
            f"Parsed invoice: {merchant}",
            f"Total: {currency} {total if total is not None else 'N/A'} (Needs Review: {needs_review})",
        )

        return InvoiceRecord(
            id=record_id,
            document_id=document_id,
            merchant=merchant,
            invoice_date=inv_date,
            total_amount=total,
            currency=currency,
            tax_amount=tax,
            invoice_number=inv_num,
            category=category,
            needs_review=needs_review,
            review_reasons=review_reasons,
            confidence_score=confidence,
            notes=f"Processed from {filename or 'document'}",
            created_at=created_at,
        )

    @staticmethod
    def list_invoices() -> List[InvoiceRecord]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM invoices ORDER BY created_at DESC")
            rows = cursor.fetchall()
            records = []
            for r in rows:
                reasons = []
                if r["review_reasons"]:
                    try:
                        reasons = json.loads(r["review_reasons"])
                    except Exception:
                        pass

                records.append(
                    InvoiceRecord(
                        id=r["id"],
                        document_id=r["document_id"],
                        merchant=r["merchant"],
                        invoice_date=r["invoice_date"],
                        total_amount=r["total_amount"],
                        currency=r["currency"],
                        tax_amount=r["tax_amount"],
                        invoice_number=r["invoice_number"],
                        category=r["category"],
                        needs_review=bool(r["needs_review"]),
                        review_reasons=reasons,
                        confidence_score=r["confidence_score"],
                        notes=r["notes"] or "",
                        created_at=r["created_at"],
                    )
                )
            return records

    @staticmethod
    def update_invoice(record_id: str, updates: InvoiceUpdateRequest) -> Optional[InvoiceRecord]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM invoices WHERE id = ?", (record_id,))
            row = cursor.fetchone()
            if not row:
                return None

            update_data = updates.model_dump(exclude_unset=True)
            if not update_data:
                return InvoiceService.get_invoice_by_id(record_id)

            set_clauses = []
            values = []
            for k, v in update_data.items():
                if k == "needs_review":
                    set_clauses.append(f"{k} = ?")
                    values.append(1 if v else 0)
                else:
                    set_clauses.append(f"{k} = ?")
                    values.append(v)

            values.append(record_id)
            cursor.execute(f"UPDATE invoices SET {', '.join(set_clauses)} WHERE id = ?", tuple(values))
            conn.commit()

        log_activity("invoice_update", f"Updated invoice {record_id[:8]}", "User manually corrected invoice details.")
        return InvoiceService.get_invoice_by_id(record_id)

    @staticmethod
    def get_invoice_by_id(record_id: str) -> Optional[InvoiceRecord]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM invoices WHERE id = ?", (record_id,))
            r = cursor.fetchone()
            if not r:
                return None
            reasons = []
            if r["review_reasons"]:
                try:
                    reasons = json.loads(r["review_reasons"])
                except Exception:
                    pass
            return InvoiceRecord(
                id=r["id"],
                document_id=r["document_id"],
                merchant=r["merchant"],
                invoice_date=r["invoice_date"],
                total_amount=r["total_amount"],
                currency=r["currency"],
                tax_amount=r["tax_amount"],
                invoice_number=r["invoice_number"],
                category=r["category"],
                needs_review=bool(r["needs_review"]),
                review_reasons=reasons,
                confidence_score=r["confidence_score"],
                notes=r["notes"] or "",
                created_at=r["created_at"],
            )

    @staticmethod
    def delete_invoice(record_id: str) -> bool:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM invoices WHERE id = ?", (record_id,))
            conn.commit()
            return cursor.rowcount > 0

    @staticmethod
    def export_csv() -> str:
        """Exports all invoice records as CSV string."""
        invoices = InvoiceService.list_invoices()
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "Invoice ID",
            "Merchant",
            "Date",
            "Total Amount",
            "Currency",
            "Tax Amount",
            "Invoice Number",
            "Category",
            "Needs Review",
            "Confidence",
            "Notes",
            "Created At",
        ])
        for inv in invoices:
            writer.writerow([
                inv.id,
                inv.merchant,
                inv.invoice_date or "",
                inv.total_amount if inv.total_amount is not None else "",
                inv.currency,
                inv.tax_amount if inv.tax_amount is not None else "",
                inv.invoice_number or "",
                inv.category,
                "YES" if inv.needs_review else "NO",
                inv.confidence_score,
                inv.notes or "",
                inv.created_at,
            ])
        return output.getvalue()
