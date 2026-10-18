import logging
import os
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any

from backend.app.config import settings
from backend.app.database import get_db_connection, log_activity
from backend.app.models.schemas import DocumentItem, SourceCitation
from backend.app.utils.security import sanitize_filename, validate_file_upload

logger = logging.getLogger(__name__)


class DocumentService:
    @staticmethod
    def extract_text_from_file(file_path: Path, filename: str) -> List[Dict[str, Any]]:
        """Extracts text page-by-page or block-by-block.
        
        Returns a list of dicts: [{"page_number": int, "text": str}]
        """
        ext = file_path.suffix.lower()
        pages: List[Dict[str, Any]] = []

        if ext == ".pdf":
            try:
                try:
                    import pymupdf as fitz
                except ImportError:
                    import fitz  # PyMuPDF
                doc = fitz.open(str(file_path))
                try:
                    for page_num in range(len(doc)):
                        page = doc[page_num]
                        text = page.get_text("text")
                        pages.append({
                            "page_number": page_num + 1,
                            "text": text.strip() or f"[Page {page_num + 1} contains scanned or non-selectable graphics]"
                        })
                finally:
                    doc.close()
            except Exception as e:
                # Basic text scanner fallback if PyMuPDF fails or is not available
                logger.warning(f"PyMuPDF extraction failed or unavailable ({e}), using raw binary text extraction fallback.")
                raw_bytes = file_path.read_bytes()
                # Find text streams in PDF
                text_matches = re.findall(rb"\((.*?)\)Tj", raw_bytes)
                if text_matches:
                    clean_text = " ".join([m.decode("latin1", errors="ignore") for m in text_matches])
                else:
                    clean_text = raw_bytes.decode("latin1", errors="ignore")
                pages.append({"page_number": 1, "text": clean_text[:20000]})
        elif ext in [".txt", ".md"]:
            content = file_path.read_text(encoding="utf-8", errors="ignore")
            # Break large text into ~1500 char virtual pages
            chunk_size = 1500
            for i in range(0, max(len(content), 1), chunk_size):
                page_text = content[i : i + chunk_size]
                pages.append({
                    "page_number": (i // chunk_size) + 1,
                    "text": page_text
                })
        elif ext == ".csv":
            try:
                import pandas as pd
                df = pd.read_csv(file_path)
                preview = df.to_string(max_rows=100)
                pages.append({"page_number": 1, "text": f"CSV Summary ({len(df)} rows, {len(df.columns)} columns):\n\n{preview}"})
            except Exception as e:
                logger.warning(f"CSV dataframe extraction failed ({e}), falling back to raw text.")
                pages.append({"page_number": 1, "text": f"CSV Content:\n{file_path.read_text(errors='ignore')[:10000]}"})

        if not pages:
            pages.append({"page_number": 1, "text": "[Empty Document]"})

        return pages

    @staticmethod
    def chunk_text(pages: List[Dict[str, Any]], chunk_size: int = 500, overlap: int = 80) -> List[Dict[str, Any]]:
        """Splits page text into search chunks while preserving page numbers."""
        chunks: List[Dict[str, Any]] = []
        chunk_idx = 0

        for page in pages:
            page_num = page["page_number"]
            text = page["text"]
            if not text:
                continue

            # Split on paragraph or sentences
            start = 0
            while start < len(text):
                end = min(start + chunk_size, len(text))
                # Try not to cut in middle of word
                if end < len(text):
                    space_idx = text.rfind(" ", start, end)
                    if space_idx > start + 100:
                        end = space_idx

                chunk_content = text[start:end].strip()
                if chunk_content:
                    chunks.append({
                        "chunk_index": chunk_idx,
                        "page_number": page_num,
                        "content": chunk_content,
                    })
                    chunk_idx += 1

                if end >= len(text):
                    break
                start = max(start + 1, end - overlap)

        return chunks

    @classmethod
    def save_and_index_document(
        cls,
        filename: str,
        content: bytes,
    ) -> Tuple[str, DocumentItem]:
        """Saves uploaded file to disk and indexes metadata and chunks into SQLite."""
        validate_file_upload(filename, content)
        doc_id = str(uuid.uuid4())
        safe_name = sanitize_filename(filename)
        unique_filename = f"{doc_id}_{safe_name}"
        dest_path = settings.upload_dir / unique_filename

        with open(dest_path, "wb") as f:
            f.write(content)

        file_size_kb = round(len(content) / 1024, 2)
        ext = Path(filename).suffix.lower()

        # Extract text & pages
        pages = cls.extract_text_from_file(dest_path, filename)
        full_text = "\n\n".join([f"--- Page {p['page_number']} ---\n{p['text']}" for p in pages])
        page_count = len(pages)
        char_count = len(full_text)
        created_at = datetime.now(timezone.utc).isoformat()

        # Save to documents table
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO documents (
                    id, filename, original_name, file_size_kb, file_type,
                    page_count, char_count, summary, extracted_text, indexed, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    doc_id,
                    unique_filename,
                    filename,
                    file_size_kb,
                    ext,
                    page_count,
                    char_count,
                    None,
                    full_text,
                    1,
                    created_at,
                ),
            )

            # Insert chunks into document_chunks table
            chunks = cls.chunk_text(pages)
            for ch in chunks:
                cursor.execute(
                    """
                    INSERT INTO document_chunks (
                        id, document_id, chunk_index, page_number, content, embedding_json, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        str(uuid.uuid4()),
                        doc_id,
                        ch["chunk_index"],
                        ch["page_number"],
                        ch["content"],
                        None,
                        created_at,
                    ),
                )

            conn.commit()

        log_activity(
            "document_upload",
            f"Uploaded {filename}",
            f"Extracted {page_count} pages ({char_count} chars) into {len(chunks)} searchable chunks.",
        )

        item = DocumentItem(
            id=doc_id,
            filename=unique_filename,
            original_name=filename,
            file_size_kb=file_size_kb,
            file_type=ext,
            page_count=page_count,
            char_count=char_count,
            summary=None,
            created_at=created_at,
            indexed=True,
        )

        return doc_id, item

    @staticmethod
    def get_document(doc_id: str) -> Optional[Dict[str, Any]]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM documents WHERE id = ?", (doc_id,))
            row = cursor.fetchone()
            if row:
                return dict(row)
        return None

    @staticmethod
    def list_documents() -> List[DocumentItem]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM documents ORDER BY created_at DESC")
            rows = cursor.fetchall()
            items = []
            for r in rows:
                items.append(
                    DocumentItem(
                        id=r["id"],
                        filename=r["filename"],
                        original_name=r["original_name"],
                        file_size_kb=r["file_size_kb"],
                        file_type=r["file_type"],
                        page_count=r["page_count"],
                        char_count=r["char_count"],
                        summary=r["summary"],
                        created_at=r["created_at"],
                        indexed=bool(r["indexed"]),
                    )
                )
            return items

    @staticmethod
    def delete_document(doc_id: str) -> bool:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT filename, original_name FROM documents WHERE id = ?", (doc_id,))
            row = cursor.fetchone()
            if not row:
                return False

            filename = row["filename"]
            original_name = row["original_name"]

            # Remove physical file if present
            file_path = settings.upload_dir / filename
            if file_path.exists():
                try:
                    file_path.unlink()
                except Exception as e:
                    logger.warning(f"Failed to delete file on disk: {e}")

            # Delete chunks and doc
            cursor.execute("DELETE FROM document_chunks WHERE document_id = ?", (doc_id,))
            cursor.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
            conn.commit()

        log_activity("document_deletion", f"Deleted {original_name}", f"Purged document and associated embeddings.")
        return True
