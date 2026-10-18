from abc import ABC, abstractmethod
from typing import AsyncIterator, Dict, List, Optional, Any


class BaseLLMProvider(ABC):
    """Abstract interface for LLM Providers.
    
    Allows swapping Ollama local inference with any custom provider,
    or a zero-dependency synthetic Demo provider for offline testing.
    """

    @abstractmethod
    async def is_available(self) -> bool:
        """Check if provider backend is reachable and responsive."""
        pass

    @abstractmethod
    def is_local(self) -> bool:
        """Indicates whether inference is run 100% locally on the device."""
        pass

    @abstractmethod
    def provider_name(self) -> str:
        """Returns the identifier name of the provider."""
        pass

    @abstractmethod
    async def list_models(self) -> List[Dict[str, Any]]:
        """List models detected/available for this provider."""
        pass

    @abstractmethod
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        model: Optional[str] = None,
        temperature: float = 0.2,
    ) -> str:
        """Generate a complete text completion."""
        pass

    @abstractmethod
    async def generate_stream(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        model: Optional[str] = None,
        temperature: float = 0.2,
    ) -> AsyncIterator[str]:
        """Stream generated text chunks asynchronously."""
        pass

    @abstractmethod
    async def get_embeddings(
        self,
        texts: List[str],
        model: Optional[str] = None,
    ) -> List[List[float]]:
        """Compute embedding vectors for RAG and semantic search."""
        pass
