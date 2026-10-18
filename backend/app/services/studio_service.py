import logging
import time
from datetime import datetime, timezone
from backend.app.database import log_activity
from backend.app.models.schemas import StudioGenerateRequest, StudioGenerateResponse
from backend.app.providers.base import BaseLLMProvider

logger = logging.getLogger(__name__)

TEMPLATE_PROMPTS = {
    "product_description": (
        "Write a high-converting, professional product description for:\n"
        "Product/Item: {topic}\n"
        "Target Audience: {target_audience}\n"
        "Key Selling Points: {key_points}\n\n"
        "Structure: Catchy headline, benefit-driven introduction, bulleted feature list, and a crisp call-to-action."
    ),
    "client_email": (
        "Draft a polished, professional client email regarding:\n"
        "Subject / Context: {topic}\n"
        "Recipient Context: {target_audience}\n"
        "Key Message: {key_points}\n\n"
        "Include a clear Subject line, warm greeting, concise body paragraphs, and polite sign-off."
    ),
    "proposal": (
        "Generate a formal business proposal for:\n"
        "Project Topic: {topic}\n"
        "Client / Audience: {target_audience}\n"
        "Key Scope & Deliverables: {key_points}\n\n"
        "Structure: Executive Summary, Scope of Work, Deliverables & Timeline, Estimated Investment, and Next Steps."
    ),
    "social_caption": (
        "Craft engaging social media copy and captions for:\n"
        "Topic / Announcement: {topic}\n"
        "Audience: {target_audience}\n"
        "Key Details: {key_points}\n\n"
        "Include an attention-grabbing hook, engaging body, relevant hashtags, and a prompt for engagement/comments."
    ),
    "service_description": (
        "Write a comprehensive freelance/consulting service description for:\n"
        "Service Offering: {topic}\n"
        "Ideal Clients: {target_audience}\n"
        "Scope & Value: {key_points}\n\n"
        "Highlight why clients should choose this service, what's included, and how to get started."
    ),
    "marketing_copy": (
        "Generate punchy marketing and ad copy for:\n"
        "Campaign Focus: {topic}\n"
        "Target Demographic: {target_audience}\n"
        "Key Highlights: {key_points}\n\n"
        "Include 3 distinct headline variations, body copy with persuasive emotional triggers, and an urgent CTA."
    ),
    "dev_article": (
        "Write an engaging, developer-centric technical article ready to publish to DEV.to via DevRelay:\n"
        "Article Focus / Problem: {topic}\n"
        "Target Readers: {target_audience}\n"
        "Core Tech Stack & Solution: {key_points}\n\n"
        "Structure:\n"
        "# Engaging Title\n"
        "## The Problem / Motivation\n"
        "## Architectural Walkthrough & Code Snippets\n"
        "## Real-World Lessons & Performance\n"
        "## Community Wrap-Up"
    ),
}


class StudioService:
    def __init__(self, provider: BaseLLMProvider):
        self.provider = provider

    async def generate_content(self, request: StudioGenerateRequest) -> StudioGenerateResponse:
        start_time = time.time()
        base_prompt_template = TEMPLATE_PROMPTS.get(
            request.template,
            "Create high-quality business content about {topic}. Key points: {key_points}",
        )

        formatted_task = base_prompt_template.format(
            topic=request.topic,
            target_audience=request.target_audience or "General audience",
            key_points=request.key_points or "Standard industry best practices",
        )

        length_guide = {
            "Short": "Keep response concise, around 100-150 words.",
            "Medium": "Provide balanced depth, around 250-400 words.",
            "Long": "Provide detailed, comprehensive coverage, around 500-750 words.",
        }.get(request.length, "Keep response balanced.")

        system_instruction = (
            f"You are an expert commercial copywriter and business strategist. "
            f"Write in {request.language} with a {request.tone} tone. {length_guide} "
            f"Use clean markdown formatting with headers and bullet points where helpful."
        )

        content = await self.provider.generate(
            prompt=formatted_task,
            system_prompt=system_instruction,
            temperature=0.7 if request.tone in ["Bold", "Persuasive"] else 0.3,
        )

        latency = round(time.time() - start_time, 2)
        log_activity(
            "studio_generate",
            f"Generated {request.template.replace('_', ' ').title()}",
            f"Tone: {request.tone} | Length: {request.length} ({latency}s)",
        )

        return StudioGenerateResponse(
            content=content.strip(),
            template=request.template,
            model_used=self.provider.provider_name(),
            latency_sec=latency,
            created_at=datetime.now(timezone.utc).isoformat(),
        )
