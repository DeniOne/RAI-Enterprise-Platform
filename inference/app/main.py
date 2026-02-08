from __future__ import annotations

import uuid

from fastapi import FastAPI, Request, Response

from .config import load_settings
from .routes import router, TRACE_HEADER

settings = load_settings()

def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.service_name,
        version=settings.version,
        description="Inference Service Shell (Sprint 1)",
    )

    @app.middleware("http")
    async def trace_id_middleware(request: Request, call_next):
        trace_id = request.headers.get(TRACE_HEADER) or str(uuid.uuid4())
        request.state.trace_id = trace_id
        response: Response = await call_next(request)
        response.headers[TRACE_HEADER] = trace_id
        return response

    app.include_router(router)
    return app

app = create_app()
