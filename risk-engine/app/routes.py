from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from .config import load_settings
from .logging import log_json

router = APIRouter()
settings = load_settings()

TRACE_HEADER = "trace-id"


@router.post("/risk/dry-run")
async def risk_dry_run(request: Request) -> JSONResponse:
    trace_id = request.headers.get(TRACE_HEADER)

    if not trace_id:
        # Read-only семантика: не генерируем trace_id
        return JSONResponse(
            status_code=400,
            content={
                "schema_version": "1.0.0",
                "trace_id": "",
                "status": "error",
                "note": "trace_id is required"
            },
        )

    log_json(
        level="INFO",
        message="Risk dry-run request received",
        service=settings.service_name,
        version=settings.version,
        trace_id=trace_id,
    )

    # TODO: согласовать поля ответа со схемой risk_evaluation_response.v1.0.0
    # TODO: risk_level и status="dry-run" запрещены схемой (additionalProperties: false)

    return JSONResponse(
        status_code=200,
        content={
            "schema_version": "1.0.0",
            "trace_id": trace_id,
            "status": "accepted",
            "note": "No risk evaluation performed"
        },
        headers={TRACE_HEADER: trace_id},
    )
