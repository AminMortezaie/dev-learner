from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.db import get_db
from app.models import Language, Project, ProjectStep
from app.schemas import ProjectOut, ProjectSnippetOut, ProjectStepOut

router = APIRouter(tags=["projects"])


def _project_out(project: Project, *, include_steps: bool, language_name: str | None) -> ProjectOut:
    steps = sorted(project.steps, key=lambda s: (s.order_index, s.id)) if project.steps else []
    return ProjectOut(
        id=project.id,
        language_id=project.language_id,
        slug=project.slug,
        title=project.title,
        description=project.description,
        difficulty=project.difficulty,
        code_language=project.code_language,
        playground_url=project.playground_url,
        language_name=language_name,
        step_count=len(steps),
        steps=[
            ProjectStepOut(
                id=s.id,
                project_id=s.project_id,
                order_index=s.order_index,
                title=s.title,
                goal=s.goal,
                instructions=s.instructions,
                snippets=[ProjectSnippetOut.model_validate(sn) for sn in (s.snippets or [])],
            )
            for s in steps
        ]
        if include_steps
        else None,
    )


@router.get("/projects", response_model=list[ProjectOut])
def list_projects(
    language_id: int | None = Query(None, alias="languageId"),
    difficulty: str | None = None,
    db: Session = Depends(get_db),
) -> list[ProjectOut]:
    stmt = (
        select(Project, Language.name.label("language_name"))
        .join(Language, Language.id == Project.language_id)
        .order_by(Project.id)
    )
    if language_id is not None:
        stmt = stmt.where(Project.language_id == language_id)
    if difficulty:
        stmt = stmt.where(Project.difficulty == difficulty)
    rows = db.execute(stmt).all()
    out: list[ProjectOut] = []
    for project, language_name in rows:
        step_count = db.scalar(
            select(func.count()).select_from(ProjectStep).where(ProjectStep.project_id == project.id)
        ) or 0
        out.append(
            ProjectOut(
                id=project.id,
                language_id=project.language_id,
                slug=project.slug,
                title=project.title,
                description=project.description,
                difficulty=project.difficulty,
                code_language=project.code_language,
                playground_url=project.playground_url,
                language_name=language_name,
                step_count=step_count,
                steps=None,
            )
        )
    return out


@router.get("/projects/{project_id}", response_model=ProjectOut)
def get_project(project_id: int, db: Session = Depends(get_db)) -> ProjectOut:
    stmt = (
        select(Project)
        .options(selectinload(Project.steps))
        .where(Project.id == project_id)
    )
    project = db.scalars(stmt).first()
    if not project:
        raise HTTPException(404, "Project not found")
    language_name = db.scalar(select(Language.name).where(Language.id == project.language_id))
    return _project_out(project, include_steps=True, language_name=language_name)


@router.get("/projects/by-slug/{language_slug}/{project_slug}", response_model=ProjectOut)
def get_project_by_slug(
    language_slug: str,
    project_slug: str,
    db: Session = Depends(get_db),
) -> ProjectOut:
    lang = db.scalars(select(Language).where(Language.slug == language_slug)).first()
    if not lang:
        raise HTTPException(404, "Language not found")
    stmt = (
        select(Project)
        .options(selectinload(Project.steps))
        .where(Project.language_id == lang.id, Project.slug == project_slug)
    )
    project = db.scalars(stmt).first()
    if not project:
        raise HTTPException(404, "Project not found")
    return _project_out(project, include_steps=True, language_name=lang.name)
