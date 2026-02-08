from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Dict

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from .config import load_settings
from .logging import log_json

router = APIRouter()
settings = load_settings()

TRACE_HEADER = "trace-id"


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@router.get("/health")
async def health() -> Dict[str, Any]:
    return {
        "status": "ok",
        "service": settings.service_name,
        "version": settings.version,
        "ts": _now_iso(),
    }


@router.post("/infer")
async def infer(request: Request) -> JSONResponse:
    trace_id = getattr(request.state, "trace_id", None) or str(uuid.uuid4())
    request_id = request.headers.get("x-request-id") or str(uuid.uuid4())

    log_json(
        level="INFO",
        message=f"Получен запрос infer request_id={request_id}",
        service=settings.service_name,
        version=settings.version,
        trace_id=trace_id,
    )

    # TODO: schema validation (Sprint 2)
    # TODO: model loading (Sprint 2)
    # TODO: Risk Engine integration (Sprint 2)
    # TODO: metrics collection (Sprint 2)

    return JSONResponse(
        status_code=202,
        content={
            "status": "accepted",
            "trace_id": trace_id,
            "note": "Inference not implemented yet",
        },
        headers={TRACE_HEADER: trace_id},
    )
