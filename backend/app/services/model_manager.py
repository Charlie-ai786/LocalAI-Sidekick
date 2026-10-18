import logging
from typing import Any, Dict, List, Optional
from backend.app.config import settings
from backend.app.models.schemas import ModelInfo, ModelStatusResponse
from backend.app.providers.base import BaseLLMProvider
from backend.app.providers.mock_demo_provider import MockDemoProvider
from backend.app.providers.ollama_provider import OllamaProvider

logger = logging.getLogger(__name__)

COMPATIBLE_MODELS: List[Dict[str, Any]] = [
    {
        "name": "Qwen 2.5 3B",
        "tag": "qwen2.5:3b",
        "size_gb": 1.9,
        "parameter_size": "3.1B",
        "family": "qwen2",
        "recommended_vram": "4 GB RAM / CPU-friendly",
        "description": "Recommended default. Outstanding instruction-following, structured JSON extraction, and multilingual support.",
        "license": "Apache 2.0",
    },
    {
        "name": "Gemma 2 2B",
        "tag": "gemma2:2b",
        "size_gb": 1.6,
        "parameter_size": "2.6B",
        "family": "gemma2",
        "recommended_vram": "3 GB RAM / Ultra-lightweight",
        "description": "Google's lightweight model. Ultra-fast CPU inference, ideal for low-spec laptops and quick document summaries.",
        "license": "Gemma Open Terms",
    },
    {
        "name": "Llama 3.2 3B",
        "tag": "llama3.2:3b",
        "size_gb": 2.0,
        "parameter_size": "3.2B",
        "family": "llama",
        "recommended_vram": "4 GB RAM / 4GB VRAM",
        "description": "Meta's state-of-the-art compact model. Excellent text synthesis, coding, and fast reasoning.",
        "license": "Llama 3.2 Community License",
    },
    {
        "name": "Qwen 2.5 7B",
        "tag": "qwen2.5:7b",
        "size_gb": 4.7,
        "parameter_size": "7.6B",
        "family": "qwen2",
        "recommended_vram": "8 GB RAM / 6GB VRAM",
        "description": "Full-size flagship tier. Superior reasoning, complex financial extraction, and multi-page contract analysis.",
        "license": "Apache 2.0",
    },
    {
        "name": "Nomic Embed Text",
        "tag": "nomic-embed-text",
        "size_gb": 0.27,
        "parameter_size": "137M",
        "family": "nomic-bert",
        "recommended_vram": "512 MB RAM",
        "description": "High-performance embedding model with 8192 token context window for local semantic search.",
        "license": "Apache 2.0",
    },
]


class ModelManager:
    _instance: Optional["ModelManager"] = None

    def __init__(self):
        self.ollama_provider = OllamaProvider(settings.ollama_base_url)
        self.mock_provider = MockDemoProvider()
        self.demo_mode = settings.demo_mode
        self.selected_model = settings.default_model

    @classmethod
    def get_instance(cls) -> "ModelManager":
        if cls._instance is None:
            cls._instance = ModelManager()
        return cls._instance

    def get_active_provider(self) -> BaseLLMProvider:
        # If demo mode is forced or Ollama is not available, return mock provider
        if self.demo_mode:
            return self.mock_provider
        return self.ollama_provider

    def set_demo_mode(self, enabled: bool) -> None:
        self.demo_mode = enabled

    def set_selected_model(self, model_tag: str) -> None:
        self.selected_model = model_tag

    async def get_status(self) -> ModelStatusResponse:
        ollama_running = await self.ollama_provider.is_available()
        installed_raw = []
        if ollama_running:
            installed_raw = await self.ollama_provider.list_models()

        installed_tags = {m.get("tag", "").split(":")[0] for m in installed_raw}
        installed_full_tags = {m.get("tag", "") for m in installed_raw}

        installed_models: List[ModelInfo] = []
        for m in installed_raw:
            installed_models.append(
                ModelInfo(
                    name=m.get("name", "Unknown"),
                    tag=m.get("tag", "Unknown"),
                    size_gb=m.get("size_gb", 0.0),
                    parameter_size=m.get("parameter_size", "Unknown"),
                    family=m.get("family", "Unknown"),
                    installed=True,
                    recommended_vram="N/A",
                    description="Installed on local Ollama runtime",
                    license="Open Weights",
                )
            )

        # Check compatible catalog against installed
        catalog: List[ModelInfo] = []
        for cat in COMPATIBLE_MODELS:
            base_tag = cat["tag"].split(":")[0]
            is_inst = (cat["tag"] in installed_full_tags) or (base_tag in installed_tags)
            catalog.append(
                ModelInfo(
                    name=cat["name"],
                    tag=cat["tag"],
                    size_gb=cat["size_gb"],
                    parameter_size=cat["parameter_size"],
                    family=cat["family"],
                    installed=is_inst,
                    recommended_vram=cat["recommended_vram"],
                    description=cat["description"],
                    license=cat["license"],
                )
            )

        active_provider = "ollama_local" if (ollama_running and not self.demo_mode) else "demo_fallback"
        msg = ""
        if not ollama_running:
            msg = (
                "Ollama is not running locally. LocalAI Sidekick is operating in Demo Mode with "
                "synthetic AI responses. To run real local open-weight models offline, start Ollama "
                "on your machine ('ollama serve')."
            )
        elif self.demo_mode:
            msg = "Demo Mode is manually toggled on. Responses are generated with simulated data."
        else:
            msg = f"Connected to local Ollama daemon. Active model: {self.selected_model} (100% On-Device Inference)."

        return ModelStatusResponse(
            ollama_running=ollama_running,
            ollama_url=settings.ollama_base_url,
            current_model=self.selected_model,
            active_provider=active_provider,
            is_local_inference=True,
            installed_models=installed_models,
            compatible_catalog=catalog,
            demo_mode_active=self.demo_mode or not ollama_running,
            message=msg,
        )
