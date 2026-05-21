from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Language, SyntaxLesson
from app.schemas import SyntaxLessonOut

router = APIRouter(tags=["syntax"])


@router.get("/syntax-lessons", response_model=list[SyntaxLessonOut])
def list_syntax_lessons(
    language_id: int | None = Query(None, alias="languageId"),
    difficulty: str | None = None,
    category: str | None = None,
    db: Session = Depends(get_db),
) -> list[SyntaxLessonOut]:
    stmt = (
        select(
            SyntaxLesson.id,
            SyntaxLesson.language_id,
            SyntaxLesson.title,
            SyntaxLesson.concept,
            SyntaxLesson.raw_syntax,
            SyntaxLesson.explanation,
            SyntaxLesson.real_world_example,
            SyntaxLesson.github_project,
            SyntaxLesson.github_url,
            SyntaxLesson.difficulty,
            SyntaxLesson.category,
            SyntaxLesson.order_index,
            Language.name.label("language_name"),
        )
        .outerjoin(Language, Language.id == SyntaxLesson.language_id)
        .order_by(SyntaxLesson.order_index, SyntaxLesson.id)
    )
    if language_id is not None:
        stmt = stmt.where(SyntaxLesson.language_id == language_id)
    if difficulty:
        stmt = stmt.where(SyntaxLesson.difficulty == difficulty)
    if category:
        stmt = stmt.where(SyntaxLesson.category == category)
    rows = db.execute(stmt).mappings().all()
    return [SyntaxLessonOut.model_validate(dict(r)) for r in rows]


@router.get("/syntax-lessons/{lesson_id}", response_model=SyntaxLessonOut)
def get_syntax_lesson(lesson_id: int, db: Session = Depends(get_db)) -> SyntaxLessonOut:
    stmt = (
        select(
            SyntaxLesson.id,
            SyntaxLesson.language_id,
            SyntaxLesson.title,
            SyntaxLesson.concept,
            SyntaxLesson.raw_syntax,
            SyntaxLesson.explanation,
            SyntaxLesson.real_world_example,
            SyntaxLesson.github_project,
            SyntaxLesson.github_url,
            SyntaxLesson.difficulty,
            SyntaxLesson.category,
            SyntaxLesson.order_index,
            Language.name.label("language_name"),
        )
        .outerjoin(Language, Language.id == SyntaxLesson.language_id)
        .where(SyntaxLesson.id == lesson_id)
    )
    row = db.execute(stmt).mappings().first()
    if not row:
        raise HTTPException(404, "Syntax lesson not found")
    return SyntaxLessonOut.model_validate(dict(row))
