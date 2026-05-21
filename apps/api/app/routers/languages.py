from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Language, Resource, SyntaxLesson, Topic
from app.schemas import LanguageOut

router = APIRouter(tags=["languages"])


@router.get("/languages", response_model=list[LanguageOut])
def list_languages(db: Session = Depends(get_db)) -> list[LanguageOut]:
    langs = db.scalars(select(Language).order_by(Language.id)).all()
    out: list[LanguageOut] = []
    for lang in langs:
        topic_count = db.scalar(
            select(func.count()).select_from(Topic).where(Topic.language_id == lang.id)
        ) or 0
        resource_count = db.scalar(
            select(func.count()).select_from(Resource).where(Resource.language_id == lang.id)
        ) or 0
        lesson_count = db.scalar(
            select(func.count()).select_from(SyntaxLesson).where(SyntaxLesson.language_id == lang.id)
        ) or 0
        out.append(
            LanguageOut(
                id=lang.id,
                slug=lang.slug,
                name=lang.name,
                description=lang.description,
                color=lang.color,
                icon=lang.icon,
                topic_count=topic_count,
                resource_count=resource_count,
                lesson_count=lesson_count,
            )
        )
    return out
