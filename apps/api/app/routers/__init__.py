from __future__ import annotations

from fastapi import APIRouter

from app.routers import (
    articles,
    dashboard,
    health,
    languages,
    projects,
    quizzes,
    resources,
    syntax,
    topics,
)

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(languages.router)
api_router.include_router(topics.router)
api_router.include_router(resources.router)
api_router.include_router(articles.router)
api_router.include_router(quizzes.router)
api_router.include_router(syntax.router)
api_router.include_router(projects.router)
api_router.include_router(dashboard.router)
