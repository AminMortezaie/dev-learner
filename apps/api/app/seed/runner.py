"""Load curated seed data from JSON (idempotent if languages already exist)."""

from __future__ import annotations

import json
from pathlib import Path

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models import (
    Article,
    Language,
    Project,
    ProjectStep,
    Quiz,
    QuizQuestion,
    Resource,
    SyntaxLesson,
    Topic,
)

# JSON lives in apps/api/seed/data (repo root of the API package)
DATA_DIR = Path(__file__).resolve().parents[2] / "seed" / "data"


def _load(name: str) -> list | dict:
    with (DATA_DIR / name).open(encoding="utf-8") as f:
        return json.load(f)


def _seed_projects(db: Session, lang_by_slug: dict[str, Language]) -> None:
    db.execute(delete(ProjectStep))
    db.execute(delete(Project))
    db.flush()

    projects_data = _load("projects.json")
    print(f"[seed] inserting {len(projects_data)} projects")
    for row in projects_data:
        lang = lang_by_slug.get(row["languageSlug"])
        if not lang:
            raise ValueError(f"Unknown language slug: {row['languageSlug']}")
        project = Project(
            language_id=lang.id,
            slug=row["slug"],
            title=row["title"],
            description=row["description"],
            difficulty=row["difficulty"],
            code_language=row["codeLanguage"],
            playground_url=row.get("playgroundUrl"),
        )
        db.add(project)
        db.flush()
        for i, step in enumerate(row.get("steps") or []):
            db.add(
                ProjectStep(
                    project_id=project.id,
                    order_index=i,
                    title=step["title"],
                    goal=step["goal"],
                    instructions=step["instructions"],
                    snippets=step.get("snippets") or [],
                )
            )


def run_seed(db: Session) -> None:
    existing = db.scalars(select(Language).limit(1)).first()
    if existing is not None:
        lang_by_slug = {lang.slug: lang for lang in db.scalars(select(Language)).all()}
        _seed_projects(db, lang_by_slug)
        db.commit()
        return

    languages_data = _load("languages.json")
    print(f"[seed] inserting {len(languages_data)} languages")
    lang_by_slug: dict[str, Language] = {}
    for row in languages_data:
        lang = Language(
            slug=row["slug"],
            name=row["name"],
            description=row["description"],
            color=row["color"],
            icon=row["icon"],
        )
        db.add(lang)
        db.flush()
        lang_by_slug[lang.slug] = lang

    topics_data = _load("topics.json")
    print(f"[seed] inserting {len(topics_data)} topics")
    topic_by_title: dict[str, Topic] = {}
    for row in topics_data:
        lang = lang_by_slug.get(row["languageSlug"])
        if not lang:
            raise ValueError(f"Unknown language slug: {row['languageSlug']}")
        topic = Topic(
            language_id=lang.id,
            title=row["title"],
            description=row["description"],
            difficulty=row["difficulty"],
            category=row["category"],
        )
        db.add(topic)
        db.flush()
        topic_by_title[topic.title] = topic

    syntax_data = _load("syntax_lessons.json")
    print(f"[seed] inserting {len(syntax_data)} syntax lessons")
    for i, row in enumerate(syntax_data):
        lang = lang_by_slug.get(row["languageSlug"])
        if not lang:
            raise ValueError(f"Unknown language slug: {row['languageSlug']}")
        db.add(
            SyntaxLesson(
                language_id=lang.id,
                title=row["title"],
                concept=row["concept"],
                raw_syntax=row.get("rawSyntax"),
                explanation=row.get("explanation"),
                real_world_example=row.get("realWorldExample"),
                github_project=row.get("githubProject"),
                github_url=row.get("githubUrl"),
                difficulty=row["difficulty"],
                category=row.get("category"),
                order_index=i,
            )
        )

    resources_data = _load("resources.json")
    print(f"[seed] inserting {len(resources_data)} resources")
    for row in resources_data:
        db.add(
            Resource(
                title=row["title"],
                url=row["url"],
                type=row["type"],
                description=row.get("description"),
                language_id=lang_by_slug[row["languageSlug"]].id if row.get("languageSlug") else None,
                topic_id=topic_by_title[row["topicTitle"]].id if row.get("topicTitle") else None,
                tags=row.get("tags"),
            )
        )

    articles_data = _load("articles.json")
    print(f"[seed] inserting {len(articles_data)} articles")
    for row in articles_data:
        db.add(
            Article(
                title=row["title"],
                content=row["content"],
                summary=row.get("summary"),
                language_id=lang_by_slug[row["languageSlug"]].id if row.get("languageSlug") else None,
                tags=row.get("tags"),
            )
        )

    quizzes_data = _load("quizzes.json")
    quiz_count = 0
    question_count = 0
    for row in quizzes_data:
        lang = lang_by_slug.get(row["languageSlug"])
        if not lang:
            raise ValueError(f"Unknown language slug: {row['languageSlug']}")
        topic = topic_by_title.get(row["topicTitle"]) if row.get("topicTitle") else None
        quiz = Quiz(
            title=row["title"],
            description=row.get("description"),
            language_id=lang.id,
            topic_id=topic.id if topic else None,
            article_id=None,
        )
        db.add(quiz)
        db.flush()
        quiz_count += 1
        for i, qq in enumerate(row.get("questions") or []):
            db.add(
                QuizQuestion(
                    quiz_id=quiz.id,
                    question=qq["question"],
                    options=qq["options"],
                    correct_answer=qq["correctAnswer"],
                    explanation=qq.get("explanation"),
                    order_index=i,
                )
            )
            question_count += 1

    _seed_projects(db, lang_by_slug)

    db.commit()
    print(f"[seed] inserted {quiz_count} quizzes with {question_count} questions")
    print("[seed] done")
