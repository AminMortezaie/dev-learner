from __future__ import annotations

import re

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.ai import quiz as ai_quiz
from app.models import Article, Language, Quiz, QuizQuestion
from app.schemas import ArticleOut, ExpandArticleQuizIn, iso

MAX_QUIZ_QUESTIONS = 50


def _serialize_article(db: Session, row: dict) -> ArticleOut:
    quiz_count = db.scalar(
        select(func.count()).select_from(Quiz).where(Quiz.article_id == row["id"])
    ) or 0
    return ArticleOut(
        id=row["id"],
        title=row["title"],
        content=row["content"],
        summary=row.get("summary"),
        language_id=row.get("language_id"),
        language_name=row.get("language_name"),
        tags=row.get("tags"),
        has_quiz=quiz_count > 0,
        created_at=iso(row.get("created_at")),
    )


def list_articles(db: Session, language_id: int | None = None) -> list[ArticleOut]:
    stmt = (
        select(
            Article.id,
            Article.title,
            Article.content,
            Article.summary,
            Article.language_id,
            Article.tags,
            Article.created_at,
            Language.name.label("language_name"),
        )
        .outerjoin(Language, Language.id == Article.language_id)
        .order_by(Article.id)
    )
    if language_id is not None:
        stmt = stmt.where(Article.language_id == language_id)
    rows = db.execute(stmt).mappings().all()
    return [_serialize_article(db, dict(r)) for r in rows]


def get_article(db: Session, article_id: int) -> ArticleOut:
    stmt = (
        select(
            Article.id,
            Article.title,
            Article.content,
            Article.summary,
            Article.language_id,
            Article.tags,
            Article.created_at,
            Language.name.label("language_name"),
        )
        .outerjoin(Language, Language.id == Article.language_id)
        .where(Article.id == article_id)
    )
    row = db.execute(stmt).mappings().first()
    if not row:
        raise LookupError("Article not found")
    return _serialize_article(db, dict(row))


def create_article(
    db: Session,
    *,
    title: str,
    content: str,
    summary: str | None,
    language_id: int | None,
    tags: str | None,
    quiz_count: int | None,
) -> ArticleOut:
    article = Article(
        title=title,
        content=content,
        summary=summary,
        language_id=language_id,
        tags=tags,
    )
    db.add(article)
    db.flush()

    language_name: str | None = None
    if article.language_id:
        language_name = db.scalar(select(Language.name).where(Language.id == article.language_id))

    questions = ai_quiz.generate_quiz_from_article(
        title=article.title,
        content=article.content,
        language=language_name,
        count=quiz_count,
    )

    quiz = Quiz(
        title=f"Quiz: {article.title}",
        description=f"Auto-generated from article #{article.id}",
        article_id=article.id,
        language_id=article.language_id,
    )
    db.add(quiz)
    db.flush()

    for i, q in enumerate(questions):
        db.add(
            QuizQuestion(
                quiz_id=quiz.id,
                question=q.question,
                options=q.options,
                correct_answer=q.correct_answer,
                explanation=q.explanation,
                order_index=i,
            )
        )

    db.commit()
    db.refresh(article)
    return get_article(db, article.id)


def polish_article_content(content: str) -> dict[str, str]:
    try:
        return {"content": ai_quiz.polish_content(content)}
    except Exception as err:
        msg = str(err)
        if "429" in msg:
            wait = None
            m = re.search(r"try again in ([^.\"]+)", msg, re.I)
            if m:
                wait = m.group(1).strip()
            raise ValueError(
                wait
                and f"AI rate limit reached. Try again in {wait}."
                or "AI rate limit reached. Please wait a minute and try again."
            ) from err
        if "413" in msg:
            raise ValueError("Content too large for AI. Try with shorter content.") from err
        raise ValueError(msg[:200]) from err


def delete_article(db: Session, article_id: int) -> None:
    quiz_ids = list(db.scalars(select(Quiz.id).where(Quiz.article_id == article_id)).all())
    if quiz_ids:
        db.execute(delete(QuizQuestion).where(QuizQuestion.quiz_id.in_(quiz_ids)))
        db.execute(delete(Quiz).where(Quiz.id.in_(quiz_ids)))
    result = db.execute(delete(Article).where(Article.id == article_id))
    if result.rowcount == 0:
        raise LookupError("Article not found")
    db.commit()


def get_article_quiz(db: Session, article_id: int) -> dict:
    quiz = db.scalar(select(Quiz).where(Quiz.article_id == article_id))
    if not quiz:
        raise LookupError("No quiz for this article")
    return _serialize_quiz(db, quiz)


def _serialize_quiz(db: Session, quiz: Quiz) -> dict:
    questions = db.scalars(
        select(QuizQuestion)
        .where(QuizQuestion.quiz_id == quiz.id)
        .order_by(QuizQuestion.order_index, QuizQuestion.id)
    ).all()
    return {
        "id": quiz.id,
        "title": quiz.title,
        "description": quiz.description,
        "article_id": quiz.article_id,
        "topic_id": quiz.topic_id,
        "language_id": quiz.language_id,
        "created_at": iso(quiz.created_at),
        "question_count": len(questions),
        "questions": [
            {
                "id": q.id,
                "quiz_id": q.quiz_id,
                "question": q.question,
                "options": q.options,
                "correctAnswer": q.correct_answer,
                "explanation": q.explanation,
                "orderIndex": q.order_index,
            }
            for q in questions
        ],
    }


def expand_article_quiz(db: Session, article_id: int, additional_count: int) -> dict:
    article = db.get(Article, article_id)
    if not article:
        raise LookupError("Article not found")

    quiz = db.scalar(select(Quiz).where(Quiz.article_id == article_id))
    if not quiz:
        raise LookupError("No quiz for this article")

    existing = db.scalars(
        select(QuizQuestion)
        .where(QuizQuestion.quiz_id == quiz.id)
        .order_by(QuizQuestion.order_index, QuizQuestion.id)
    ).all()
    if len(existing) >= MAX_QUIZ_QUESTIONS:
        raise ValueError(f"Quiz already has the maximum of {MAX_QUIZ_QUESTIONS} questions")

    to_add = min(additional_count, MAX_QUIZ_QUESTIONS - len(existing))
    language_name: str | None = None
    if article.language_id:
        language_name = db.scalar(select(Language.name).where(Language.id == article.language_id))

    new_questions = ai_quiz.generate_quiz_from_article(
        title=article.title,
        content=article.content,
        language=language_name,
        count=to_add,
        exclude={q.question for q in existing},
    )
    if not new_questions:
        raise ValueError("Could not generate additional unique questions from this article")

    start_index = len(existing)
    for offset, q in enumerate(new_questions):
        db.add(
            QuizQuestion(
                quiz_id=quiz.id,
                question=q.question,
                options=q.options,
                correct_answer=q.correct_answer,
                explanation=q.explanation,
                order_index=start_index + offset,
            )
        )

    db.commit()
    return _serialize_quiz(db, quiz)
