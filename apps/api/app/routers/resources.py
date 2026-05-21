from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Language, Resource, Topic
from app.schemas import ResourceIn, ResourceOut, iso

router = APIRouter(tags=["resources"])


def _resource_out(row: dict) -> ResourceOut:
    return ResourceOut(
        id=row["id"],
        title=row["title"],
        url=row["url"],
        type=row["type"],
        description=row.get("description"),
        language_id=row.get("language_id"),
        language_name=row.get("language_name"),
        topic_id=row.get("topic_id"),
        topic_title=row.get("topic_title"),
        tags=row.get("tags"),
        created_at=iso(row.get("created_at")),
    )


@router.get("/resources", response_model=list[ResourceOut])
def list_resources(
    language_id: int | None = Query(None, alias="languageId"),
    topic_id: int | None = Query(None, alias="topicId"),
    type: str | None = None,
    db: Session = Depends(get_db),
) -> list[ResourceOut]:
    stmt = (
        select(
            Resource.id,
            Resource.title,
            Resource.url,
            Resource.type,
            Resource.description,
            Resource.language_id,
            Resource.topic_id,
            Resource.tags,
            Resource.created_at,
            Language.name.label("language_name"),
            Topic.title.label("topic_title"),
        )
        .outerjoin(Language, Language.id == Resource.language_id)
        .outerjoin(Topic, Topic.id == Resource.topic_id)
        .order_by(Resource.id)
    )
    if language_id is not None:
        stmt = stmt.where(Resource.language_id == language_id)
    if topic_id is not None:
        stmt = stmt.where(Resource.topic_id == topic_id)
    if type:
        stmt = stmt.where(Resource.type == type)
    rows = db.execute(stmt).mappings().all()
    return [_resource_out(dict(r)) for r in rows]


@router.post("/resources", response_model=ResourceOut, status_code=201)
def create_resource(body: ResourceIn, db: Session = Depends(get_db)) -> ResourceOut:
    resource = Resource(
        title=body.title,
        url=body.url,
        type=body.type,
        description=body.description,
        language_id=body.language_id,
        topic_id=body.topic_id,
        tags=body.tags,
    )
    db.add(resource)
    db.commit()
    db.refresh(resource)
    return ResourceOut(
        id=resource.id,
        title=resource.title,
        url=resource.url,
        type=resource.type,
        description=resource.description,
        language_id=resource.language_id,
        topic_id=resource.topic_id,
        tags=resource.tags,
        created_at=iso(resource.created_at),
    )


@router.get("/resources/{resource_id}", response_model=ResourceOut)
def get_resource(resource_id: int, db: Session = Depends(get_db)) -> ResourceOut:
    stmt = (
        select(
            Resource.id,
            Resource.title,
            Resource.url,
            Resource.type,
            Resource.description,
            Resource.language_id,
            Resource.topic_id,
            Resource.tags,
            Resource.created_at,
            Language.name.label("language_name"),
            Topic.title.label("topic_title"),
        )
        .outerjoin(Language, Language.id == Resource.language_id)
        .outerjoin(Topic, Topic.id == Resource.topic_id)
        .where(Resource.id == resource_id)
    )
    row = db.execute(stmt).mappings().first()
    if not row:
        raise HTTPException(404, "Resource not found")
    return _resource_out(dict(row))


@router.delete("/resources/{resource_id}", status_code=204)
def delete_resource(resource_id: int, db: Session = Depends(get_db)) -> Response:
    result = db.execute(delete(Resource).where(Resource.id == resource_id))
    if result.rowcount == 0:
        raise HTTPException(404, "Resource not found")
    db.commit()
    return Response(status_code=204)
