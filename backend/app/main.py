import logging
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from backend.app.config import settings
from backend.app.database import init_db
from backend.app.routes import (
    dashboard,
    devrelay,
    documents,
    invoices,
    models,
    search,
    studio,
)
from backend.app.utils.sample_data import seed_sample_data_if_empty

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("localai_sidekick")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database and seed sample data
    logger.info("Starting LocalAI Sidekick Backend...")
    init_db()
    try:
        seed_sample_data_if_empty()
    except Exception as e:
        logger.warning(f"Error during sample data seeding: {e}")
    yield
    logger.info("LocalAI Sidekick Backend shutdown complete.")


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Privacy-First AI Assistant for Freelancers and Small Businesses powered by local open-weight models.",
    lifespan=lifespan,
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Development local CORS
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(dashboard.router)
app.include_router(documents.router)
app.include_router(invoices.router)
app.include_router(studio.router)
app.include_router(search.router)
app.include_router(models.router)
app.include_router(devrelay.router)


@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "app": settings.app_name,
        "version": settings.app_version,
        "privacy": "100% Local Inference (No external API keys required)",
    }


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Unhandled error processing {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Check backend logs for details."},
    )


# Serve built frontend in production (e.g. Render single-service deployment)
FRONTEND_DIST = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if FRONTEND_DIST.exists():
    logger.info(f"Mounting production frontend assets from {FRONTEND_DIST}")
    assets_dir = FRONTEND_DIST / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_frontend(full_path: str):
        if full_path.startswith("api") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
            return JSONResponse(status_code=404, content={"detail": "API endpoint not found"})
        target = FRONTEND_DIST / full_path
        if target.is_file():
            return FileResponse(target)
        index_file = FRONTEND_DIST / "index.html"
        if index_file.exists():
            return FileResponse(index_file)
        return JSONResponse(status_code=404, content={"detail": "Frontend build not found"})

