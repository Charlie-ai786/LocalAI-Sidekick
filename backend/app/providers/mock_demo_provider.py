import asyncio
import json
import re
from typing import AsyncIterator, Dict, List, Optional, Any
from backend.app.providers.base import BaseLLMProvider


class MockDemoProvider(BaseLLMProvider):
    """Synthetic local demo provider.
    
    Provides rich, realistic responses for users evaluating LocalAI Sidekick
    before installing Ollama or on machines without local GPU/model downloads.
    """

    def provider_name(self) -> str:
        return "demo_fallback"

    def is_local(self) -> bool:
        return True

    async def is_available(self) -> bool:
        return True

    async def list_models(self) -> List[Dict[str, Any]]:
        return [
            {
                "name": "qwen2.5:3b (Simulated Demo)",
                "tag": "qwen2.5:3b",
                "size_gb": 1.9,
                "parameter_size": "3.1B",
                "family": "qwen2",
                "installed": True,
            },
            {
                "name": "gemma2:2b (Simulated Demo)",
                "tag": "gemma2:2b",
                "size_gb": 1.6,
                "parameter_size": "2.6B",
                "family": "gemma2",
                "installed": True,
            },
            {
                "name": "llama3.2:3b (Simulated Demo)",
                "tag": "llama3.2:3b",
                "size_gb": 2.0,
                "parameter_size": "3.2B",
                "family": "llama",
                "installed": True,
            },
        ]

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        model: Optional[str] = None,
        temperature: float = 0.2,
    ) -> str:
        await asyncio.sleep(0.4)  # Natural response feel
        prompt_lower = prompt.lower()

        # 1. Invoice Extraction JSON
        if "extract invoice" in prompt_lower or "extract receipt" in prompt_lower or "json" in prompt_lower:
            return self._generate_invoice_json(prompt)

        # 2. Document Summary
        if "summarize" in prompt_lower or "summary" in prompt_lower:
            return (
                "### Executive Summary\n\n"
                "This document covers key operational and financial details for business activities. "
                "The core deliverables focus on privacy-first local workflow execution, automated records management, "
                "and structured financial reporting without recurring cloud API fees.\n\n"
                "**Key Highlights:**\n"
                "- High compliance with privacy regulations via strictly local data processing\n"
                "- Automated document categorization and financial field extraction\n"
                "- Direct time-savings of 4-6 hours weekly for administrative overhead\n"
                "- Ready for export and immediate audit verification"
            )

        # 3. Document Q&A / RAG
        if "context:" in prompt_lower or "question:" in prompt_lower:
            if "not found" in prompt_lower or "banana" in prompt_lower or "extraneous" in prompt_lower:
                return "The requested information could not be found in the provided source document."
            return (
                "Based on the provided document excerpts, the key terms confirm that processing is executed "
                "on-premises without external API transmission. All transactions, invoice totals, and record updates "
                "are stored locally in the SQLite database and can be verified via the source document page citations."
            )

        # 4. Business Studio Templates
        if "product description" in prompt_lower:
            return (
                "Introducing **LocalAI Sidekick Pro** — the intelligent, private workstation built for modern freelancers "
                "and growing enterprises. Experience real-time PDF intelligence, instant invoice ledgering, and AI copywriting "
                "powered entirely by open-weight models on your own machine. Zero monthly subscriptions, zero API tokens, "
                "and 100% data sovereignty."
            )
        if "client email" in prompt_lower or "email" in prompt_lower:
            return (
                "Subject: Project Milestone Update & Next Steps\n\n"
                "Hi Alex,\n\n"
                "I hope you're having a productive week! I am pleased to share that we have completed the current phase "
                "ahead of schedule. All document intelligence pipelines and invoice workflows are fully operational.\n\n"
                "Please review the attached summary at your convenience, and let me know if Thursday at 2:00 PM works for a quick walkthrough.\n\n"
                "Best regards,\nYour Business Partner"
            )
        if "proposal" in prompt_lower:
            return (
                "# Business Proposal: Intelligent Document Automation\n\n"
                "## 1. Executive Summary\n"
                "Our solution provides self-hosted, private intelligence workflows that eliminate monthly API overhead.\n\n"
                "## 2. Scope of Work\n"
                "- Full deployment of local document indexing & search\n"
                "- Automated receipt parsing with manual review safeguards\n"
                "- Custom business content generation studio\n\n"
                "## 3. Timeline & Investment\n"
                "Turnaround: 2 weeks. Total investment: $3,200 (flat fixed fee with zero recurring SaaS costs)."
            )

        # Generic helpful AI response
        return (
            "Here is the synthesized analysis based on your query:\n\n"
            "1. **Core Objective**: Ensure transparent, high-integrity output with verified source ground truth.\n"
            "2. **Privacy Guarantees**: All computations run locally on device.\n"
            "3. **Actionable Next Step**: You can verify or edit this directly in your workspace."
        )

    async def generate_stream(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        model: Optional[str] = None,
        temperature: float = 0.2,
    ) -> AsyncIterator[str]:
        full_text = await self.generate(prompt, system_prompt, model, temperature)
        words = full_text.split(" ")
        for i, word in enumerate(words):
            yield word + (" " if i < len(words) - 1 else "")
            await asyncio.sleep(0.02)

    async def get_embeddings(
        self,
        texts: List[str],
        model: Optional[str] = None,
    ) -> List[List[float]]:
        # Deterministic lightweight normalized embedding
        import math
        dim = 128
        results = []
        for text in texts:
            vec = [0.0] * dim
            tokens = text.lower().split()
            for token in tokens:
                idx = abs(hash(token)) % dim
                vec[idx] += 1.0
            norm = math.sqrt(sum(v * v for v in vec))
            if norm > 0:
                vec = [v / norm for v in vec]
            results.append(vec)
        return results

    def _generate_invoice_json(self, prompt: str) -> str:
        # Extract numbers or merchant from prompt if possible
        merchant_match = re.search(r"(?:merchant|vendor|from|company):\s*([^\n,]+)", prompt, re.IGNORECASE)
        total_matches = re.findall(
            r"(?<!sub)(?<!sub-)(?<!sub\s)\b(?:total|amount\s+due|grand\s+total)\b\s*[:\-]?\s*[$€£₹]?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2}))",
            prompt,
            re.IGNORECASE,
        )

        merchant = merchant_match.group(1).strip() if merchant_match else "Apex Cloud Services LLC"
        total = 485.50
        if total_matches:
            try:
                total = float(total_matches[-1].replace(",", ""))
            except Exception:
                pass

        data = {
            "merchant": merchant,
            "invoice_date": "2026-03-15",
            "total_amount": total,
            "currency": "USD",
            "tax_amount": round(total * 0.08, 2),
            "invoice_number": "INV-2026-8841",
            "category": "Software & Subscriptions",
            "confidence_score": 0.95,
            "needs_review": False,
            "review_reasons": [],
            "notes": "Verified extracted values match line items."
        }
        return json.dumps(data, indent=2)
