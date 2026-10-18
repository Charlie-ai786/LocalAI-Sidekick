import os
import sys
from pathlib import Path
import uvicorn

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8000"))
    host = os.getenv("HOST", "0.0.0.0" if os.getenv("RENDER") else "127.0.0.1")
    reload = False if os.getenv("RENDER") else True
    uvicorn.run("backend.app.main:app", host=host, port=port, reload=reload, app_dir=str(ROOT_DIR))

