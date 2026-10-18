import logging
from typing import Optional
from fastapi import APIRouter, Body, HTTPException

from backend.app.models.schemas import ModelStatusResponse
from backend.app.services.model_manager import ModelManager

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/models", tags=["models"])


@router.get("/status", response_model=ModelStatusResponse)
async def get_model_status():
    manager = ModelManager.get_instance()
    return await manager.get_status()


@router.post("/select")
async def select_model(model_tag: str = Body(..., embed=True)):
    manager = ModelManager.get_instance()
    manager.set_selected_model(model_tag)
    return {"message": f"Active model set to '{model_tag}'.", "model": model_tag}


@router.post("/demo-mode")
async def toggle_demo_mode(enabled: bool = Body(..., embed=True)):
    manager = ModelManager.get_instance()
    manager.set_demo_mode(enabled)
    mode_text = "Demo Mode (Simulated AI)" if enabled else "Ollama Local Engine"
    return {"message": f"Switched to {mode_text}.", "demo_mode": enabled}
