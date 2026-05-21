from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas import QuizAttemptIn, QuizAttemptOut, QuizOut
from app.services import quizzes as quizzes_service

router = APIRouter(tags=["quizzes"])


@router.get("/quizzes", response_model=list[QuizOut])
def list_quizzes(
    language_id: int | None = Query(None, alias="languageId"),
    topic_id: int | None = Query(None, alias="topicId"),
    article_id: int | None = Query(None, alias="articleId"),
    db: Session = Depends(get_db),
) -> list[QuizOut]:
    return quizzes_service.list_quizzes(
        db, language_id=language_id, topic_id=topic_id, article_id=article_id
    )


@router.get("/quizzes/{quiz_id}", response_model=QuizOut)
def get_quiz(quiz_id: int, db: Session = Depends(get_db)) -> QuizOut:
    try:
        return quizzes_service.get_quiz(db, quiz_id)
    except LookupError as err:
        raise HTTPException(404, str(err)) from err


@router.post("/quizzes/{quiz_id}/attempt", response_model=QuizAttemptOut)
def submit_quiz_attempt(
    quiz_id: int,
    body: QuizAttemptIn,
    db: Session = Depends(get_db),
) -> QuizAttemptOut:
    try:
        answers = [
            {"question_id": a.question_id, "selected_answer": a.selected_answer}
            for a in body.answers
        ]
        return quizzes_service.submit_quiz_attempt(db, quiz_id, answers)
    except LookupError as err:
        raise HTTPException(404, str(err)) from err
