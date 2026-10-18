import json
import sqlite3
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from backend.app.config import settings


def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(settings.db_path))
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """Initializes the database schema if tables do not exist."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        # Documents table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS documents (
                id TEXT PRIMARY KEY,
                filename TEXT NOT NULL,
                original_name TEXT NOT NULL,
                file_size_kb REAL NOT NULL,
                file_type TEXT NOT NULL,
                page_count INTEGER NOT NULL DEFAULT 1,
                char_count INTEGER NOT NULL DEFAULT 0,
                summary TEXT,
                extracted_text TEXT,
                indexed INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL
            )
        """)

        # Document chunks table (for RAG & semantic search)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS document_chunks (
                id TEXT PRIMARY KEY,
                document_id TEXT NOT NULL,
                chunk_index INTEGER NOT NULL,
                page_number INTEGER NOT NULL DEFAULT 1,
                content TEXT NOT NULL,
                embedding_json TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE CASCADE
            )
        """)

        # Invoices / Receipts table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS invoices (
                id TEXT PRIMARY KEY,
                document_id TEXT,
                merchant TEXT NOT NULL,
                invoice_date TEXT,
                total_amount REAL,
                currency TEXT NOT NULL DEFAULT 'USD',
                tax_amount REAL,
                invoice_number TEXT,
                category TEXT NOT NULL DEFAULT 'General Business',
                needs_review INTEGER NOT NULL DEFAULT 0,
                review_reasons TEXT, -- JSON array
                confidence_score REAL NOT NULL DEFAULT 1.0,
                notes TEXT DEFAULT '',
                created_at TEXT NOT NULL,
                FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE SET NULL
            )
        """)

        # Activity logs table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS activities (
                id TEXT PRIMARY KEY,
                activity_type TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'success'
            )
        """)

        # System settings & provider config table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS app_state (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )
        """)

        conn.commit()


# Helper DB operations
def log_activity(activity_type: str, title: str, description: str, status: str = "success") -> None:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO activities (id, activity_type, title, description, timestamp, status)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                str(uuid.uuid4()),
                activity_type,
                title,
                description,
                datetime.now(timezone.utc).isoformat(),
                status,
            ),
        )
        conn.commit()


def get_recent_activities(limit: int = 10) -> List[Dict[str, Any]]:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT id, activity_type, title, description, timestamp, status
            FROM activities
            ORDER BY timestamp DESC
            LIMIT ?
            """,
            (limit,),
        )
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
