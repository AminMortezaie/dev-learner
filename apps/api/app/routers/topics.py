from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Language, Topic
from app.schemas import TopicIn, TopicOut, iso

router = APIRouter(tags=["topics"])


def _topic_out(row: dict) -> TopicOut:
    return TopicOut(
        id=row["id"],
        language_id=row["language_id"],
        title=row["title"],
        description=row["description"],
        difficulty=row["difficulty"],
        category=row["category"],
        language_name=row.get("language_name"),
        created_at=iso(row.get("created_at")),
    )


@router.get("/topics", response_model=list[TopicOut])
def list_topics(
    language_id: int | None = Query(None, alias="languageId"),
    difficulty: str | None = None,
    db: Session = Depends(get_db),
) -> list[TopicOut]:
    stmt = (
        select(
            Topic.id,
            Topic.language_id,
            Topic.title,
            Topic.description,
            Topic.difficulty,
            Topic.category,
            Topic.created_at,
            Language.name.label("language_name"),
        )
        .outerjoin(Language, Language.id == Topic.language_id)
        .order_by(Topic.id)
    )
    if language_id is not None:
        stmt = stmt.where(Topic.language_id == language_id)
    if difficulty:
        stmt = stmt.where(Topic.difficulty == difficulty)
    rows = db.execute(stmt).mappings().all()
    return [_topic_out(dict(r)) for r in rows]


@router.post("/topics", response_model=TopicOut, status_code=201)
def create_topic(body: TopicIn, db: Session = Depends(get_db)) -> TopicOut:
    topic = Topic(
        language_id=body.language_id,
        title=body.title,
        description=body.description,
        difficulty=body.difficulty,
        category=body.category,
    )
    db.add(topic)
    db.commit()
    db.refresh(topic)
    return TopicOut(
        id=topic.id,
        language_id=topic.language_id,
        title=topic.title,
        description=topic.description,
        difficulty=topic.difficulty,
        category=topic.category,
        created_at=iso(topic.created_at),
    )


@router.get("/topics/{topic_id}", response_model=TopicOut)
def get_topic(topic_id: int, db: Session = Depends(get_db)) -> TopicOut:
    stmt = (
        select(
            Topic.id,
            Topic.language_id,
            Topic.title,
            Topic.description,
            Topic.difficulty,
            Topic.category,
            Topic.created_at,
            Language.name.label("language_name"),
        )
        .outerjoin(Language, Language.id == Topic.language_id)
        .where(Topic.id == topic_id)
    )
    row = db.execute(stmt).mappings().first()
    if not row:
        raise HTTPException(404, "Topic not found")
    return _topic_out(dict(row))
