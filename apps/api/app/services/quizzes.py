from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Language, Quiz, QuizQuestion
from app.schemas import QuizAttemptOut, QuizOut, QuizQuestionOut, QuizResultItem, iso

PASS_THRESHOLD = 0.7


def _quiz_row_out(row: dict, question_count: int) -> QuizOut:
    return QuizOut(
        id=row["id"],
        title=row["title"],
        description=row.get("description"),
        article_id=row.get("article_id"),
        topic_id=row.get("topic_id"),
        language_id=row.get("language_id"),
        language_name=row.get("language_name"),
        question_count=question_count,
        created_at=iso(row.get("created_at")),
    )


def list_quizzes(
    db: Session,
    *,
    language_id: int | None = None,
    topic_id: int | None = None,
    article_id: int | None = None,
) -> list[QuizOut]:
    stmt = (
        select(
            Quiz.id,
            Quiz.title,
            Quiz.description,
            Quiz.article_id,
            Quiz.topic_id,
            Quiz.language_id,
            Quiz.created_at,
            Language.name.label("language_name"),
        )
        .outerjoin(Language, Language.id == Quiz.language_id)
        .order_by(Quiz.id)
    )
    if language_id is not None:
        stmt = stmt.where(Quiz.language_id == language_id)
    if topic_id is not None:
        stmt = stmt.where(Quiz.topic_id == topic_id)
    if article_id is not None:
        stmt = stmt.where(Quiz.article_id == article_id)

    rows = db.execute(stmt).mappings().all()
    if not rows:
        return []

    quiz_ids = [r["id"] for r in rows]
    count_map: dict[int, int] = {}
    for row in db.execute(
        select(QuizQuestion.quiz_id, func.count().label("c"))
        .where(QuizQuestion.quiz_id.in_(quiz_ids))
        .group_by(QuizQuestion.quiz_id)
    ):
        count_map[row[0]] = row[1]

    return [_quiz_row_out(dict(r), count_map.get(r["id"], 0)) for r in rows]


def get_quiz(db: Session, quiz_id: int) -> QuizOut:
    stmt = (
        select(
            Quiz.id,
            Quiz.title,
            Quiz.description,
            Quiz.article_id,
            Quiz.topic_id,
            Quiz.language_id,
            Quiz.created_at,
            Language.name.label("language_name"),
        )
        .outerjoin(Language, Language.id == Quiz.language_id)
        .where(Quiz.id == quiz_id)
    )
    row = db.execute(stmt).mappings().first()
    if not row:
        raise LookupError("Quiz not found")

    questions = db.scalars(
        select(QuizQuestion)
        .where(QuizQuestion.quiz_id == quiz_id)
        .order_by(QuizQuestion.order_index, QuizQuestion.id)
    ).all()

    out = _quiz_row_out(dict(row), len(questions))
    out.questions = [
        QuizQuestionOut(
            id=q.id,
            quiz_id=q.quiz_id,
            question=q.question,
            options=q.options,
            correct_answer=q.correct_answer,
            explanation=q.explanation,
            order_index=q.order_index,
        )
        for q in questions
    ]
    return out


def submit_quiz_attempt(
    db: Session,
    quiz_id: int,
    answers: list[dict],
) -> QuizAttemptOut:
    questions = db.scalars(select(QuizQuestion).where(QuizQuestion.quiz_id == quiz_id)).all()
    if not questions:
        raise LookupError("Quiz has no questions")

    by_id = {q.id: q for q in questions}
    results: list[QuizResultItem] = []
    for a in answers:
        q = by_id.get(a["question_id"])
        if not q:
            results.append(
                QuizResultItem(
                    question_id=a["question_id"],
                    correct=False,
                    correct_answer=-1,
                    explanation="Unknown question id",
                )
            )
        else:
            results.append(
                QuizResultItem(
                    question_id=a["question_id"],
                    correct=a["selected_answer"] == q.correct_answer,
                    correct_answer=q.correct_answer,
                    explanation=q.explanation,
                )
            )

    correct_count = sum(1 for r in results if r.correct)
    total = len(questions)
    score = correct_count / total
    return QuizAttemptOut(
        score=score,
        total_questions=total,
        correct_count=correct_count,
        passed=score >= PASS_THRESHOLD,
        results=results,
    )
