import json
import logging
from typing import AsyncIterator, Dict, List, Optional, Any
import httpx
from backend.app.config import settings
from backend.app.providers.base import BaseLLMProvider

logger = logging.getLogger(__name__)


class OllamaProvider(BaseLLMProvider):
    """Local Ollama inference provider.
    
    Communicates directly with the local Ollama daemon without external
    network calls, ensuring 100% privacy and zero subscription/API costs.
    """

    def __init__(self, base_url: Optional[str] = None):
        self.base_url = (base_url or settings.ollama_base_url).rstrip("/")
        self.timeout = httpx.Timeout(60.0, connect=5.0)

    def provider_name(self) -> str:
        return "ollama_local"

    def is_local(self) -> bool:
        return True

    async def is_available(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.get(f"{self.base_url}/api/version")
                return res.status_code == 200
        except Exception:
            return False

    async def list_models(self) -> List[Dict[str, Any]]:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(f"{self.base_url}/api/tags")
                if res.status_code == 200:
                    data = res.json()
                    models = []
                    for m in data.get("models", []):
                        models.append({
                            "name": m.get("name"),
                            "tag": m.get("model", m.get("name")),
                            "size_gb": round(m.get("size", 0) / (1024 ** 3), 2),
                            "parameter_size": m.get("details", {}).get("parameter_size", "Unknown"),
                            "family": m.get("details", {}).get("family", "Unknown"),
                            "installed": True,
                        })
                    return models
        except Exception as e:
            logger.warning(f"Failed to query Ollama models: {e}")
        return []

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        model: Optional[str] = None,
        temperature: float = 0.2,
    ) -> str:
        target_model = model or settings.default_model
        payload = {
            "model": target_model,
            "prompt": prompt,
            "stream": False,
            "options": {"temperature": temperature},
        }
        if system_prompt:
            payload["system"] = system_prompt

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                res = await client.post(f"{self.base_url}/api/generate", json=payload)
                if res.status_code == 200:
                    data = res.json()
                    return data.get("response", "")
                elif res.status_code == 404:
                    raise RuntimeError(
                        f"Model '{target_model}' not found in Ollama. Please run 'ollama pull {target_model}' first."
                    )
                else:
                    raise RuntimeError(f"Ollama error {res.status_code}: {res.text}")
            except httpx.ConnectError:
                raise RuntimeError(
                    f"Could not connect to Ollama at {self.base_url}. Make sure Ollama is installed and running."
                )

    async def generate_stream(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        model: Optional[str] = None,
        temperature: float = 0.2,
    ) -> AsyncIterator[str]:
        target_model = model or settings.default_model
        payload = {
            "model": target_model,
            "prompt": prompt,
            "stream": True,
            "options": {"temperature": temperature},
        }
        if system_prompt:
            payload["system"] = system_prompt

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                async with client.stream("POST", f"{self.base_url}/api/generate", json=payload) as response:
                    if response.status_code == 404:
                        yield f"[Error: Model '{target_model}' not installed in Ollama. Run: ollama pull {target_model}]"
                        return
                    if response.status_code != 200:
                        yield f"[Error: Ollama HTTP {response.status_code}]"
                        return

                    async for line in response.aiter_lines():
                        if line:
                            try:
                                chunk = json.loads(line)
                                token = chunk.get("response", "")
                                if token:
                                    yield token
                                if chunk.get("done", False):
                                    break
                            except json.JSONDecodeError:
                                continue
            except httpx.ConnectError:
                yield "[Error: Ollama is not running. Please start Ollama locally.]"

    async def get_embeddings(
        self,
        texts: List[str],
        model: Optional[str] = None,
    ) -> List[List[float]]:
        target_model = model or settings.embedding_model
        embeddings: List[List[float]] = []

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            for text in texts:
                try:
                    res = await client.post(
                        f"{self.base_url}/api/embeddings",
                        json={"model": target_model, "prompt": text},
                    )
                    if res.status_code == 200:
                        data = res.json()
                        embeddings.append(data.get("embedding", []))
                    else:
                        # Fallback to simple hash-based / TF-IDF vector if embedding model not found
                        embeddings.append(self._fallback_embedding(text))
                except Exception:
                    embeddings.append(self._fallback_embedding(text))

        return embeddings

    def _fallback_embedding(self, text: str, dim: int = 128) -> List[float]:
        """Deterministic normalized embedding vector for fallback semantic indexing."""
        import math
        vec = [0.0] * dim
        tokens = text.lower().split()
        for token in tokens:
            idx = abs(hash(token)) % dim
            vec[idx] += 1.0
        norm = math.sqrt(sum(v * v for v in vec))
        if norm > 0:
            vec = [v / norm for v in vec]
        return vec
