from __future__ import annotations

from fastapi import APIRouter

from app.schemas import HealthStatus

router = APIRouter(tags=["health"])


@router.get("/healthz", response_model=HealthStatus)
def health_check() -> HealthStatus:
    return HealthStatus(status="ok")
