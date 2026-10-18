import logging
from typing import Any, Dict, List, Optional
import httpx

from backend.app.config import settings

logger = logging.getLogger(__name__)

CURATED_LOCAL_AI_PROMPTS = [
    {
        "id": "privacy_rag",
        "title": "Private Document RAG Analyzer",
        "category": "Documents & Compliance",
        "description": "Analyze sensitive contracts, NDAs, or medical papers without sending bytes to third-party clouds.",
        "prompt": "You are a privacy-first legal and technical compliance analyst. Review the provided document snippets, highlight liabilities, payment obligations, expiration dates, and flag any clauses that require attention.",
        "recommended_model": "qwen2.5:3b",
    },
    {
        "id": "invoice_extractor",
        "title": "Structured Expense & Tax Parser",
        "category": "Accounting & Finance",
        "description": "Extract merchant names, dates, line items, VAT/sales tax, and total amounts into structured JSON.",
        "prompt": "Extract the transaction details into clean JSON: merchant, date (YYYY-MM-DD), invoice_number, total_amount (float), tax_amount (float), currency, and spending category. If uncertain, add a note in review_reasons.",
        "recommended_model": "qwen2.5:3b",
    },
    {
        "id": "dev_tutorial",
        "title": "DEV.to Technical Article & Tutorial",
        "category": "Developer Community",
        "description": "Draft an engaging DEV.to blog post detailing an architecture solve, privacy engineering, or local LLM setup.",
        "prompt": "Write a clear, developer-focused technical tutorial for DEV.to. Explain the architectural problem, why local inference was chosen, show concise code blocks, list tradeoffs, and include a call-to-action for the developer community.",
        "recommended_model": "qwen2.5:3b",
    },
    {
        "id": "api_documentation",
        "title": "Clean OpenAPI / FastAPI Spec Explainer",
        "category": "Developer Tools",
        "description": "Convert complex backend endpoints into markdown documentation with example requests and responses.",
        "prompt": "Generate developer-ready markdown API documentation with curl examples, request payload schemas, status codes, and error handling explanations.",
        "recommended_model": "qwen2.5:3b",
    },
    {
        "id": "freelance_pitch",
        "title": "Solopreneur Client Proposal",
        "category": "Business Studio",
        "description": "Persuasive technical proposal emphasizing on-premise security, predictable milestones, and zero cloud lock-in.",
        "prompt": "Draft a formal project proposal with executive summary, deliverables, tech stack justification (local AI for data privacy), 3-week milestone roadmap, and warranty terms.",
        "recommended_model": "qwen2.5:3b",
    },
]


class DevRelayService:
    BASE_URL = "https://dev.to/api"

    @classmethod
    async def get_feed(cls, tag: Optional[str] = None, page: int = 1, per_page: int = 12) -> List[Dict[str, Any]]:
        """Fetch articles from DEV.to API filtered by tag or latest."""
        headers = {"User-Agent": "LocalAISidekick-DevRelay/1.0"}
        params: Dict[str, Any] = {"page": page, "per_page": min(per_page, 30)}
        if tag and tag.strip():
            params["tag"] = tag.strip().lower()
        else:
            # Default to curated tags relevant to this app
            params["tag"] = "ai"

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(f"{cls.BASE_URL}/articles", params=params, headers=headers)
                if res.status_code == 200:
                    raw_articles = res.json()
                    return [cls._format_article(a) for a in raw_articles]
                logger.warning(f"DEV.to API returned status {res.status_code}: {res.text[:200]}")
                return []
        except Exception as e:
            logger.error(f"Error fetching DEV.to feed: {e}")
            return []

    @classmethod
    async def search_articles(cls, query: str, page: int = 1, per_page: int = 12) -> List[Dict[str, Any]]:
        """Search articles on DEV.to."""
        headers = {"User-Agent": "LocalAISidekick-DevRelay/1.0"}
        # DEV.to search uses /articles?tag= or query parameter
        params: Dict[str, Any] = {"page": page, "per_page": min(per_page, 30)}
        clean_q = query.strip().lower()
        if clean_q in ["ollama", "ai", "privacy", "fastapi", "react", "python", "opensource", "webdev"]:
            params["tag"] = clean_q
        else:
            params["q"] = clean_q

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(f"{cls.BASE_URL}/articles", params=params, headers=headers)
                if res.status_code == 200:
                    raw_articles = res.json()
                    return [cls._format_article(a) for a in raw_articles]
                return []
        except Exception as e:
            logger.error(f"Error searching DEV.to: {e}")
            return []

    @classmethod
    async def get_article_detail(cls, article_id: int) -> Optional[Dict[str, Any]]:
        """Fetch full markdown content and details of a DEV.to article."""
        headers = {"User-Agent": "LocalAISidekick-DevRelay/1.0"}
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(f"{cls.BASE_URL}/articles/{article_id}", headers=headers)
                if res.status_code == 200:
                    data = res.json()
                    return {
                        "id": data.get("id"),
                        "title": data.get("title"),
                        "description": data.get("description"),
                        "body_markdown": data.get("body_markdown"),
                        "url": data.get("url"),
                        "cover_image": data.get("cover_image"),
                        "published_at": data.get("published_at"),
                        "readable_publish_date": data.get("readable_publish_date"),
                        "tag_list": data.get("tag_list") or data.get("tags") or [],
                        "reading_time_minutes": data.get("reading_time_minutes", 1),
                        "positive_reactions_count": data.get("positive_reactions_count", 0),
                        "comments_count": data.get("comments_count", 0),
                        "user": {
                            "name": (data.get("user") or {}).get("name", "Unknown Author"),
                            "username": (data.get("user") or {}).get("username", ""),
                            "profile_image": (data.get("user") or {}).get("profile_image", ""),
                        },
                    }
                return None
        except Exception as e:
            logger.error(f"Error retrieving DEV article {article_id}: {e}")
            return None

    @classmethod
    async def publish_article(
        cls,
        title: str,
        body_markdown: str,
        tags: List[str],
        published: bool = False,
        api_key: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Publish or draft a post to DEV.to.
        Adheres to DEV.to AI disclosure policy by attaching `ai_disclosure_level: "some_ai"`.
        """
        key = api_key or getattr(settings, "dev_api_key", None)
        if not key or not key.strip():
            return {
                "success": False,
                "message": "Missing DEV API key. Please provide your DEV.to API key in settings or the publish modal.",
                "edit_url": None,
                "url": None,
                "article_id": None,
            }

        headers = {
            "api-key": key.strip(),
            "Content-Type": "application/json",
            "User-Agent": "LocalAISidekick-DevRelay/1.0",
        }

        # Clean tags (max 4, alphanumeric)
        cleaned_tags = [t.strip().replace("#", "").replace(" ", "").lower() for t in tags if t.strip()][:4]
        if not cleaned_tags:
            cleaned_tags = ["ai", "opensource", "webdev"]

        payload = {
            "article": {
                "title": title.strip(),
                "body_markdown": body_markdown.strip(),
                "published": published,
                "tags": cleaned_tags,
                "ai_disclosure_level": "some_ai",
            }
        }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(f"{cls.BASE_URL}/articles", json=payload, headers=headers)
                if res.status_code in (200, 201):
                    data = res.json()
                    article_id = data.get("id")
                    url = data.get("url")
                    # DEV draft edit link
                    edit_url = f"https://dev.to/dashboard/{article_id}/edit" if not published else url
                    return {
                        "success": True,
                        "article_id": article_id,
                        "title": data.get("title", title),
                        "url": url,
                        "edit_url": edit_url,
                        "published": published,
                        "message": (
                            f"Successfully published live to DEV.to!"
                            if published
                            else f"Successfully created DEV.to draft! You can review and publish it from your DEV dashboard."
                        ),
                    }
                err_text = res.text
                logger.error(f"DEV.to publish error {res.status_code}: {err_text}")
                return {
                    "success": False,
                    "message": f"DEV.to error ({res.status_code}): {err_text}",
                    "article_id": None,
                    "url": None,
                    "edit_url": None,
                }
        except Exception as e:
            logger.error(f"Error publishing to DEV.to: {e}")
            return {
                "success": False,
                "message": f"Connection error publishing to DEV.to: {str(e)}",
                "article_id": None,
                "url": None,
                "edit_url": None,
            }

    @classmethod
    def get_curated_prompts(cls) -> List[Dict[str, Any]]:
        return CURATED_LOCAL_AI_PROMPTS

    @staticmethod
    def _format_article(raw: Dict[str, Any]) -> Dict[str, Any]:
        user = raw.get("user") or {}
        tag_list = raw.get("tag_list")
        if not tag_list:
            tags = raw.get("tags")
            if isinstance(tags, list):
                tag_list = tags
            elif isinstance(tags, str):
                tag_list = [t.strip() for t in tags.split(",") if t.strip()]
            else:
                tag_list = []

        return {
            "id": raw.get("id"),
            "title": raw.get("title"),
            "description": raw.get("description"),
            "url": raw.get("url"),
            "cover_image": raw.get("cover_image"),
            "published_at": raw.get("published_at"),
            "readable_publish_date": raw.get("readable_publish_date"),
            "tag_list": tag_list,
            "reading_time_minutes": raw.get("reading_time_minutes", 1),
            "positive_reactions_count": raw.get("positive_reactions_count", 0),
            "comments_count": raw.get("comments_count", 0),
            "user": {
                "name": user.get("name", "Unknown Author"),
                "username": user.get("username", ""),
                "profile_image": user.get("profile_image", ""),
            },
        }
