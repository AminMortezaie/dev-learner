from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas import DashboardStats, LanguageProgress, RecentActivity
from app.services import dashboard as dashboard_service

router = APIRouter(tags=["dashboard"])


@router.get("/dashboard/stats", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)) -> DashboardStats:
    return dashboard_service.get_dashboard_stats(db)


@router.get("/dashboard/recent-activity", response_model=RecentActivity)
def get_recent_activity(db: Session = Depends(get_db)) -> RecentActivity:
    return dashboard_service.get_recent_activity(db)


@router.get("/dashboard/language-progress", response_model=list[LanguageProgress])
def get_language_progress(db: Session = Depends(get_db)) -> list[LanguageProgress]:
    return dashboard_service.get_language_progress(db)
