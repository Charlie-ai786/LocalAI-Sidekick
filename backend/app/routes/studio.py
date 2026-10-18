import logging
from typing import Any, Dict, List
from fastapi import APIRouter

from backend.app.models.schemas import StudioGenerateRequest, StudioGenerateResponse
from backend.app.services.model_manager import ModelManager
from backend.app.services.studio_service import StudioService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/studio", tags=["studio"])

STUDIO_TEMPLATES = [
    {
        "id": "product_description",
        "title": "Product Description",
        "description": "Compelling ecommerce & SaaS product copy highlighting features, specs, and benefits.",
        "icon": "Package",
        "default_topic": "Ergonomic Mechanical Keyboard with Wireless Bluetooth & Hot-swap Switches",
        "default_points": "Aluminum chassis, 4000mAh battery (up to 200 hours), Gateron Pro switches, RGB backlighting",
    },
    {
        "id": "client_email",
        "title": "Client Email",
        "description": "Professional client communication for project updates, follow-ups, and milestone deliveries.",
        "icon": "Mail",
        "default_topic": "Sprint 3 Milestone Completion and Demo Presentation Invite",
        "default_points": "Frontend components built, backend integration complete, invite for 30-min walkthrough Thursday",
    },
    {
        "id": "proposal",
        "title": "Business Proposal",
        "description": "Formal freelance & agency proposals with scope, timeline, deliverables, and pricing.",
        "icon": "FileText",
        "default_topic": "AI Document Processing Automation for Local Accounting Firm",
        "default_points": "Automated receipt extraction, on-premise local inference, privacy compliance, 3-week implementation",
    },
    {
        "id": "social_caption",
        "title": "Social Media Copy",
        "description": "High-engagement social captions for LinkedIn, X/Twitter, and Instagram with hooks and hashtags.",
        "icon": "Share2",
        "default_topic": "Why running AI locally saves small businesses thousands in recurring API fees",
        "default_points": "Zero token costs, 100% data privacy, works offline, no cloud lock-in",
    },
    {
        "id": "service_description",
        "title": "Service Offering",
        "description": "Clear service breakdown for consulting, freelancing, or agency service menus.",
        "icon": "Briefcase",
        "default_topic": "Full-Stack Custom Automation Consulting",
        "default_points": "End-to-end audit, custom local AI integrations, developer documentation, 30 days post-launch support",
    },
    {
        "id": "marketing_copy",
        "title": "Marketing & Ad Copy",
        "description": "Persuasive ad headlines, landing page value propositions, and email newsletter copy.",
        "icon": "Zap",
        "default_topic": "Privacy-First Local AI Assistant for Solopreneurs",
        "default_points": "Own your models, keep client data on your laptop, zero subscription fatigue",
    },
    {
        "id": "dev_article",
        "title": "DEV.to Tech Article",
        "description": "Developer tutorial or architecture breakdown formatted for DevRelay & DEV.to publication.",
        "icon": "Globe",
        "default_topic": "Building a 100% Local RAG Document Intelligence System with FastAPI & Ollama",
        "default_points": "Vector embeddings on device, no third-party cloud leaks, sub-second inference, privacy compliance",
    },
]


@router.get("/templates")
async def get_templates() -> List[Dict[str, Any]]:
    return STUDIO_TEMPLATES


@router.post("/generate", response_model=StudioGenerateResponse)
async def generate_content(req: StudioGenerateRequest):
    manager = ModelManager.get_instance()
    provider = manager.get_active_provider()
    studio = StudioService(provider)
    return await studio.generate_content(req)
