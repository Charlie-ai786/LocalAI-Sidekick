import logging
from typing import Optional
from fastapi import APIRouter, Query

from backend.app.models.schemas import SearchResponse
from backend.app.services.model_manager import ModelManager
from backend.app.services.rag_service import RAGService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/search", tags=["search"])


@router.get("", response_model=SearchResponse)
async def search_documents(
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(10, ge=1, le=50),
):
    manager = ModelManager.get_instance()
    provider = manager.get_active_provider()
    rag = RAGService(provider)

    results = await rag.search_documents(query=q, limit=limit)
    return SearchResponse(
        query=q,
        results=results,
        total_matches=len(results),
    )
