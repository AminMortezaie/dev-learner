from __future__ import annotations

from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session

from app.models import Article, Language, Quiz, Resource, SyntaxLesson, Topic
from app.schemas import ArticleOut, DashboardStats, LanguageProgress, RecentActivity, ResourceOut, QuizOut, iso


def get_dashboard_stats(db: Session) -> DashboardStats:
    return DashboardStats(
        total_topics=db.scalar(select(func.count()).select_from(Topic)) or 0,
        total_resources=db.scalar(select(func.count()).select_from(Resource)) or 0,
        total_articles=db.scalar(select(func.count()).select_from(Article)) or 0,
        total_quizzes=db.scalar(select(func.count()).select_from(Quiz)) or 0,
        total_syntax_lessons=db.scalar(select(func.count()).select_from(SyntaxLesson)) or 0,
        total_languages=db.scalar(select(func.count()).select_from(Language)) or 0,
    )


def get_recent_activity(db: Session) -> RecentActivity:
    recent = 5
    resources = db.scalars(select(Resource).order_by(desc(Resource.id)).limit(recent)).all()
    articles = db.scalars(select(Article).order_by(desc(Article.id)).limit(recent)).all()
    quizzes = db.scalars(select(Quiz).order_by(desc(Quiz.id)).limit(recent)).all()

    return RecentActivity(
        resources=[
            ResourceOut(
                id=r.id,
                title=r.title,
                url=r.url,
                type=r.type,
                description=r.description,
                language_id=r.language_id,
                topic_id=r.topic_id,
                tags=r.tags,
                created_at=iso(r.created_at),
            )
            for r in resources
        ],
        articles=[
            ArticleOut(
                id=a.id,
                title=a.title,
                content=a.content,
                summary=a.summary,
                language_id=a.language_id,
                tags=a.tags,
                created_at=iso(a.created_at),
            )
            for a in articles
        ],
        quizzes=[
            QuizOut(
                id=q.id,
                title=q.title,
                description=q.description,
                article_id=q.article_id,
                topic_id=q.topic_id,
                language_id=q.language_id,
                created_at=iso(q.created_at),
            )
            for q in quizzes
        ],
    )


def get_language_progress(db: Session) -> list[LanguageProgress]:
    langs = db.scalars(select(Language).order_by(Language.id)).all()
    out: list[LanguageProgress] = []
    for lang in langs:
        out.append(
            LanguageProgress(
                language_id=lang.id,
                language_name=lang.name,
                topic_count=db.scalar(
                    select(func.count()).select_from(Topic).where(Topic.language_id == lang.id)
                )
                or 0,
                resource_count=db.scalar(
                    select(func.count()).select_from(Resource).where(Resource.language_id == lang.id)
                )
                or 0,
                lesson_count=db.scalar(
                    select(func.count())
                    .select_from(SyntaxLesson)
                    .where(SyntaxLesson.language_id == lang.id)
                )
                or 0,
                quiz_count=db.scalar(
                    select(func.count()).select_from(Quiz).where(Quiz.language_id == lang.id)
                )
                or 0,
            )
        )
    return out
