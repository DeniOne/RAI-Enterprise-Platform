from __future__ import annotations

from fastapi import FastAPI

from .config import load_settings
from .routes import router

settings = load_settings()

def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.service_name,
        version=settings.version,
        description="Risk Engine Dry-Run (Sprint 1)",
    )
    app.include_router(router)
    return app

app = create_app()
