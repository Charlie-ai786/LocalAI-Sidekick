import logging
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query

from backend.app.models.schemas import (
    DevRelayArticleDetail,
    DevRelayArticleItem,
    DevRelayPromptItem,
    DevRelayPublishRequest,
    DevRelayPublishResponse,
)
from backend.app.services.devrelay_service import DevRelayService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/devrelay", tags=["devrelay"])

CURATED_TAGS = [
    {"tag": "ollama", "label": "Ollama & Local LLMs", "icon": "Cpu"},
    {"tag": "ai", "label": "Artificial Intelligence", "icon": "Sparkles"},
    {"tag": "privacy", "label": "Data Privacy & Security", "icon": "Shield"},
    {"tag": "opensource", "label": "Open Source", "icon": "GitBranch"},
    {"tag": "fastapi", "label": "FastAPI & Python", "icon": "Zap"},
    {"tag": "react", "label": "React & Frontend", "icon": "Code"},
    {"tag": "showdev", "label": "Show DEV Projects", "icon": "Award"},
]


@router.get("/feed", response_model=List[DevRelayArticleItem])
async def get_devrelay_feed(
    tag: Optional[str] = Query(None, description="Tag to filter DEV articles by"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(12, ge=1, le=30, description="Articles per page"),
):
    """Retrieve community articles and developer guides from DEV.to."""
    articles = await DevRelayService.get_feed(tag=tag, page=page, per_page=per_page)
    return articles


@router.get("/search", response_model=List[DevRelayArticleItem])
async def search_devrelay(
    q: str = Query(..., min_length=1, description="Search query"),
    page: int = Query(1, ge=1),
    per_page: int = Query(12, ge=1, le=30),
):
    """Search DEV.to community for technical topics, local AI guides, and models."""
    return await DevRelayService.search_articles(query=q, page=page, per_page=per_page)


@router.get("/article/{article_id}", response_model=DevRelayArticleDetail)
async def get_article_detail(article_id: int):
    """Fetch full markdown content and details of a single DEV article."""
    article = await DevRelayService.get_article_detail(article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found or unavailable on DEV.to")
    return article


@router.post("/publish", response_model=DevRelayPublishResponse)
async def publish_to_devrelay(req: DevRelayPublishRequest):
    """
    Publish or stage draft content to DEV.to.
    Complies with DEV.to AI disclosure guidelines (some_ai).
    """
    result = await DevRelayService.publish_article(
        title=req.title,
        body_markdown=req.body_markdown,
        tags=req.tags,
        published=req.published,
        api_key=req.api_key,
    )
    return DevRelayPublishResponse(**result)


@router.get("/prompts", response_model=List[DevRelayPromptItem])
async def get_community_prompts():
    """Retrieve curated, local AI and developer prompts."""
    return DevRelayService.get_curated_prompts()


@router.get("/tags")
async def get_curated_tags() -> List[Dict[str, str]]:
    """Get curated tags for fast filtering."""
    return CURATED_TAGS
