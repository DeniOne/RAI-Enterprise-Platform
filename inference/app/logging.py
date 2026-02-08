from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from typing import Any, Dict


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def log_json(level: str, message: str, service: str, version: str, trace_id: str) -> None:
    record: Dict[str, Any] = {
        "timestamp": _now_iso(),
        "level": level,
        "service": service,
        "version": version,
        "trace_id": trace_id,
        "message": message,
    }

    sys.stdout.write(json.dumps(record, ensure_ascii=False) + "\n")
