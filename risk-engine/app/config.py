from __future__ import annotations

from dataclasses import dataclass
import os


@dataclass(frozen=True)
class Settings:
    service_name: str = "risk-engine"
    version: str = "0.1.0"


def load_settings() -> Settings:
    service_name = os.getenv("SERVICE_NAME") or "risk-engine"
    version = os.getenv("SERVICE_VERSION") or "0.1.0"
    return Settings(service_name=service_name, version=version)
