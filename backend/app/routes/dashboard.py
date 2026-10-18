import logging
import os
from collections import defaultdict
from typing import Any, Dict, List
from fastapi import APIRouter

from backend.app.config import settings
from backend.app.database import get_db_connection, get_recent_activities
from backend.app.models.schemas import ActivityLogItem, DashboardStats
from backend.app.services.model_manager import ModelManager

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats():
    # 1. Query documents
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as count FROM documents")
        total_docs = cursor.fetchone()["count"]

        # 2. Query invoices
        cursor.execute("SELECT * FROM invoices")
        invoices = cursor.fetchall()

    total_invoices = len(invoices)
    total_expenses = 0.0
    needs_review_count = 0
    expenses_by_cat = defaultdict(float)
    monthly_map = defaultdict(float)

    for inv in invoices:
        amt = inv["total_amount"] or 0.0
        total_expenses += amt
        if inv["needs_review"]:
            needs_review_count += 1
        cat = inv["category"] or "General Business"
        expenses_by_cat[cat] += amt

        # Group by Month if invoice_date is available
        date_str = inv["invoice_date"]
        month_label = "2026-03"
        if date_str and len(date_str) >= 7:
            month_label = date_str[:7]
        monthly_map[month_label] += amt

    # Format monthly expenses for charts
    monthly_expenses = [
        {"month": m, "amount": round(v, 2)}
        for m, v in sorted(monthly_map.items())
    ]
    if not monthly_expenses:
        monthly_expenses = [
            {"month": "2026-01", "amount": 0.0},
            {"month": "2026-02", "amount": 0.0},
            {"month": "2026-03", "amount": 0.0},
        ]

    # Calculate storage used
    storage_bytes = 0
    if settings.upload_dir.exists():
        for f in settings.upload_dir.glob("*"):
            if f.is_file():
                storage_bytes += f.stat().st_size
    storage_mb = round(storage_bytes / (1024 * 1024), 2)

    # Recent activities
    raw_activities = get_recent_activities(limit=8)
    activities = [
        ActivityLogItem(
            id=a["id"],
            activity_type=a["activity_type"],
            title=a["title"],
            description=a["description"],
            timestamp=a["timestamp"],
            status=a["status"],
        )
        for a in raw_activities
    ]

    # Model status
    manager = ModelManager.get_instance()
    status = await manager.get_status()

    return DashboardStats(
        total_documents=total_docs,
        total_invoices=total_invoices,
        total_expenses=round(total_expenses, 2),
        needs_review_count=needs_review_count,
        storage_used_mb=storage_mb,
        recent_activities=activities,
        expenses_by_category={k: round(v, 2) for k, v in expenses_by_cat.items()},
        monthly_expenses=monthly_expenses,
        model_status={
            "ollama_running": status.ollama_running,
            "current_model": status.current_model,
            "active_provider": status.active_provider,
            "is_local_inference": True,
            "demo_mode_active": status.demo_mode_active,
        },
    )
