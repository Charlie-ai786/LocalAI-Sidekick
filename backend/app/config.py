import os
from pathlib import Path
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
UPLOAD_DIR = DATA_DIR / "uploads"
DB_PATH = DATA_DIR / "localai_sidekick.db"

# Ensure data directories exist
DATA_DIR.mkdir(parents=True, exist_ok=True)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


class Settings(BaseModel):
    app_name: str = "LocalAI Sidekick"
    app_version: str = "1.0.0"
    ollama_base_url: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    default_model: str = os.getenv("DEFAULT_MODEL", "qwen2.5:3b")
    embedding_model: str = os.getenv("EMBEDDING_MODEL", "nomic-embed-text")
    demo_mode: bool = os.getenv("DEMO_MODE", "false").lower() in ("true", "1", "yes")
    max_upload_size_mb: int = 25
    allowed_extensions: list[str] = [".pdf", ".txt", ".csv", ".md"]
    dev_api_key: str = os.getenv("DEV_API_KEY", "")
    data_dir: Path = DATA_DIR
    upload_dir: Path = UPLOAD_DIR
    db_path: Path = DB_PATH


settings = Settings()
