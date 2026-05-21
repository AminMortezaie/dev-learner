from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas import ArticleIn, ArticleOut, PolishIn, PolishOut
from app.services import articles as articles_service

router = APIRouter(tags=["articles"])


@router.get("/articles", response_model=list[ArticleOut])
def list_articles(
    language_id: int | None = Query(None, alias="languageId"),
    db: Session = Depends(get_db),
) -> list[ArticleOut]:
    return articles_service.list_articles(db, language_id)


@router.post("/articles", response_model=ArticleOut, status_code=201)
def create_article(body: ArticleIn, db: Session = Depends(get_db)) -> ArticleOut:
    return articles_service.create_article(
        db,
        title=body.title,
        content=body.content,
        summary=body.summary,
        language_id=body.language_id,
        tags=body.tags,
        quiz_count=body.quiz_count,
    )


@router.post("/articles/polish", response_model=PolishOut)
def polish_article(body: PolishIn) -> PolishOut:
    try:
        result = articles_service.polish_article_content(body.content)
        return PolishOut(**result)
    except ValueError as err:
        msg = str(err)
        if "rate limit" in msg.lower():
            raise HTTPException(429, msg) from err
        if "too large" in msg.lower():
            raise HTTPException(413, msg) from err
        raise HTTPException(500, msg) from err


@router.get("/articles/{article_id}", response_model=ArticleOut)
def get_article(article_id: int, db: Session = Depends(get_db)) -> ArticleOut:
    try:
        return articles_service.get_article(db, article_id)
    except LookupError as err:
        raise HTTPException(404, str(err)) from err


@router.delete("/articles/{article_id}", status_code=204)
def delete_article(article_id: int, db: Session = Depends(get_db)) -> Response:
    try:
        articles_service.delete_article(db, article_id)
    except LookupError as err:
        raise HTTPException(404, str(err)) from err
    return Response(status_code=204)


@router.get("/articles/{article_id}/quiz")
def get_article_quiz(article_id: int, db: Session = Depends(get_db)) -> dict:
    try:
        return articles_service.get_article_quiz(db, article_id)
    except LookupError as err:
        raise HTTPException(404, str(err)) from err
