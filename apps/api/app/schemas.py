from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


def to_camel(snake: str) -> str:
    parts = snake.split("_")
    return parts[0] + "".join(p.title() for p in parts[1:])


class CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        serialize_by_alias=True,
        from_attributes=True,
    )


class HealthStatus(CamelModel):
    status: str


class LanguageOut(CamelModel):
    id: int
    slug: str
    name: str
    description: str
    color: str
    icon: str
    topic_count: Optional[int] = None
    resource_count: Optional[int] = None
    lesson_count: Optional[int] = None


class TopicOut(CamelModel):
    id: int
    language_id: int
    title: str
    description: str
    difficulty: str
    category: str
    language_name: str | None = None
    created_at: datetime | str | None = None


class TopicIn(CamelModel):
    language_id: int
    title: str
    description: str
    difficulty: Literal["beginner", "intermediate", "advanced"]
    category: str


class ResourceOut(CamelModel):
    id: int
    title: str
    url: str
    type: str
    description: str | None = None
    language_id: int | None = None
    language_name: str | None = None
    topic_id: int | None = None
    topic_title: str | None = None
    tags: str | None = None
    created_at: datetime | str | None = None


class ResourceIn(CamelModel):
    title: str
    url: str
    type: Literal["article", "video", "documentation", "github", "course", "book"]
    description: str | None = None
    language_id: int | None = None
    topic_id: int | None = None
    tags: str | None = None


class ArticleOut(CamelModel):
    id: int
    title: str
    content: str
    summary: str | None = None
    language_id: int | None = None
    language_name: str | None = None
    tags: str | None = None
    has_quiz: bool | None = None
    created_at: datetime | str | None = None


class ArticleIn(CamelModel):
    title: str
    content: str
    summary: str | None = None
    language_id: int | None = None
    tags: str | None = None
    quiz_count: int | None = Field(default=None, ge=1, le=20)


class PolishIn(CamelModel):
    content: str = Field(min_length=1)


class PolishOut(CamelModel):
    content: str


class QuizQuestionOut(CamelModel):
    id: int
    quiz_id: int
    question: str
    options: list[str]
    correct_answer: int
    explanation: str | None = None
    order_index: int | None = None


class QuizOut(CamelModel):
    id: int
    title: str
    description: str | None = None
    article_id: int | None = None
    topic_id: int | None = None
    language_id: int | None = None
    language_name: str | None = None
    question_count: int | None = None
    questions: list[QuizQuestionOut] | None = None
    created_at: datetime | str | None = None


class QuizAnswerIn(CamelModel):
    question_id: int
    selected_answer: int


class QuizAttemptIn(CamelModel):
    answers: list[QuizAnswerIn]


class QuizResultItem(CamelModel):
    question_id: int
    correct: bool
    correct_answer: int
    explanation: str | None = None


class QuizAttemptOut(CamelModel):
    score: float
    total_questions: int
    correct_count: int
    passed: bool
    results: list[QuizResultItem]


class SyntaxLessonOut(CamelModel):
    id: int
    language_id: int
    title: str
    concept: str
    raw_syntax: str | None = None
    explanation: str | None = None
    real_world_example: str | None = None
    github_project: str | None = None
    github_url: str | None = None
    difficulty: str
    category: str | None = None
    order_index: int | None = None
    language_name: str | None = None


class DashboardStats(CamelModel):
    total_topics: int
    total_resources: int
    total_articles: int
    total_quizzes: int
    total_syntax_lessons: int
    total_languages: int


class RecentActivity(CamelModel):
    resources: list[ResourceOut]
    articles: list[ArticleOut]
    quizzes: list[QuizOut]


class LanguageProgress(CamelModel):
    language_id: int
    language_name: str
    topic_count: int
    resource_count: int
    lesson_count: int
    quiz_count: int


def iso(dt: datetime | None) -> str | None:
    return dt.isoformat() if dt else None
