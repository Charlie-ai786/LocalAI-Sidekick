import json
import logging
import math
import time
from typing import Any, Dict, List, Optional, Tuple

from backend.app.database import get_db_connection, log_activity
from backend.app.models.schemas import DocumentAskResponse, SourceCitation, SearchResultItem
from backend.app.providers.base import BaseLLMProvider
from backend.app.utils.security import sanitize_and_guard_prompt

logger = logging.getLogger(__name__)


def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    if not v1 or not v2 or len(v1) != len(v2):
        return 0.0
    dot = sum(a * b for a, b in zip(v1, v2))
    norm_a = math.sqrt(sum(a * a for a in v1))
    norm_b = math.sqrt(sum(b * b for b in v2))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


class RAGService:
    def __init__(self, provider: BaseLLMProvider):
        self.provider = provider

    async def retrieve_relevant_chunks(
        self,
        query: str,
        document_id: Optional[str] = None,
        top_k: int = 4,
    ) -> List[Dict[str, Any]]:
        """Retrieves top matching chunks combining semantic embeddings and keyword matching."""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            if document_id:
                cursor.execute(
                    """
                    SELECT c.id, c.document_id, c.chunk_index, c.page_number, c.content,
                           d.original_name as document_name
                    FROM document_chunks c
                    JOIN documents d ON c.document_id = d.id
                    WHERE c.document_id = ?
                    """,
                    (document_id,),
                )
            else:
                cursor.execute(
                    """
                    SELECT c.id, c.document_id, c.chunk_index, c.page_number, c.content,
                           d.original_name as document_name
                    FROM document_chunks c
                    JOIN documents d ON c.document_id = d.id
                    """
                )
            rows = cursor.fetchall()

        if not rows:
            return []

        # Compute query vector
        query_embeddings = await self.provider.get_embeddings([query])
        q_vec = query_embeddings[0] if query_embeddings else []

        scored_chunks = []
        query_terms = set(re_tokenize(query.lower()))

        for r in rows:
            content = r["content"]
            # 1. Keyword overlap score
            content_terms = set(re_tokenize(content.lower()))
            overlap = len(query_terms.intersection(content_terms))
            kw_score = overlap / max(len(query_terms), 1)

            # 2. Approximate / vector score
            chunk_vecs = await self.provider.get_embeddings([content[:300]])
            sem_score = cosine_similarity(q_vec, chunk_vecs[0]) if chunk_vecs else 0.0

            # Combined weighted score
            final_score = (sem_score * 0.6) + (kw_score * 0.4)

            scored_chunks.append({
                "chunk_id": r["id"],
                "document_id": r["document_id"],
                "document_name": r["document_name"],
                "page_number": r["page_number"],
                "content": content,
                "score": round(final_score, 4),
            })

        # Sort descending
        scored_chunks.sort(key=lambda x: x["score"], reverse=True)
        return scored_chunks[:top_k]

    async def answer_question(
        self,
        question: str,
        document_id: Optional[str] = None,
        top_k: int = 4,
    ) -> DocumentAskResponse:
        start_time = time.time()
        relevant_chunks = await self.retrieve_relevant_chunks(question, document_id, top_k)

        # Check if no relevant sources or very low relevance
        if not relevant_chunks or (relevant_chunks[0]["score"] < 0.08 and len(question.split()) > 2):
            return DocumentAskResponse(
                answer="I could not find an answer to your question in the uploaded document(s). "
                       "Please try rephrasing your query or ensure the relevant file is uploaded.",
                sources=[],
                found_in_source=False,
                model_used=self.provider.provider_name(),
                latency_sec=round(time.time() - start_time, 2),
            )

        # Assemble context with page citations
        context_blocks = []
        citations: List[SourceCitation] = []

        for ch in relevant_chunks:
            context_blocks.append(
                f"[Source: {ch['document_name']} | Page {ch['page_number']}]\n{ch['content']}"
            )
            citations.append(
                SourceCitation(
                    document_id=ch["document_id"],
                    document_name=ch["document_name"],
                    page_number=ch["page_number"],
                    snippet=ch["content"][:200] + ("..." if len(ch["content"]) > 200 else ""),
                    relevance_score=ch["score"],
                )
            )

        full_context = "\n\n---\n\n".join(context_blocks)
        guarded_prompt, flagged = sanitize_and_guard_prompt(full_context, question)

        # Invoke LLM
        raw_answer = await self.provider.generate(
            prompt=guarded_prompt,
            system_prompt=(
                "You are an expert document intelligence assistant. Answer questions truthfully "
                "using ONLY the provided document context. Cite the specific Page Number when stating facts. "
                "If the document does not contain enough info, state clearly that the answer was not found in the source."
            ),
        )

        # Check if LLM itself noted it's not found
        found_in_source = True
        not_found_phrases = [
            "could not be found",
            "not found in the",
            "not found in",
            "not mentioned in",
            "does not contain",
            "cannot find an answer",
            "unable to find",
        ]
        if any(p in raw_answer.lower() for p in not_found_phrases):
            found_in_source = False

        latency = round(time.time() - start_time, 2)
        log_activity(
            "rag_query",
            f"Q&A: {question[:40]}...",
            f"Retrieved {len(citations)} source citations ({latency}s)",
        )

        return DocumentAskResponse(
            answer=raw_answer.strip(),
            sources=citations,
            found_in_source=found_in_source,
            model_used=self.provider.provider_name(),
            latency_sec=latency,
        )

    async def search_documents(
        self,
        query: str,
        limit: int = 10,
    ) -> List[SearchResultItem]:
        """Performs cross-document hybrid search returning snippets and page references."""
        chunks = await self.retrieve_relevant_chunks(query, document_id=None, top_k=limit)
        results: List[SearchResultItem] = []
        for ch in chunks:
            if ch["score"] > 0.05:
                results.append(
                    SearchResultItem(
                        document_id=ch["document_id"],
                        document_name=ch["document_name"],
                        page_number=ch["page_number"],
                        snippet=ch["content"][:240] + ("..." if len(ch["content"]) > 240 else ""),
                        match_score=ch["score"],
                        match_type="semantic" if ch["score"] > 0.3 else "keyword",
                    )
                )
        return results


def re_tokenize(text: str) -> List[str]:
    import re
    return [t for t in re.findall(r"\b[a-zA-Z0-9_\$]+\b", text) if len(t) > 1]
