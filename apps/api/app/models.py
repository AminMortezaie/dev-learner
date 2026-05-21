from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import ForeignKey, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class Language(Base):
    __tablename__ = "languages"

    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    color: Mapped[str] = mapped_column(Text, nullable=False)
    icon: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)


class Topic(Base):
    __tablename__ = "topics"

    id: Mapped[int] = mapped_column(primary_key=True)
    language_id: Mapped[int] = mapped_column(ForeignKey("languages.id"), nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    difficulty: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)


class Resource(Base):
    __tablename__ = "resources"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    url: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    language_id: Mapped[Optional[int]] = mapped_column(ForeignKey("languages.id"))
    topic_id: Mapped[Optional[int]] = mapped_column(ForeignKey("topics.id"))
    tags: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)


class Article(Base):
    __tablename__ = "articles"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    summary: Mapped[Optional[str]] = mapped_column(Text)
    language_id: Mapped[Optional[int]] = mapped_column(ForeignKey("languages.id"))
    tags: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)


class Quiz(Base):
    __tablename__ = "quizzes"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    article_id: Mapped[Optional[int]] = mapped_column(ForeignKey("articles.id"))
    topic_id: Mapped[Optional[int]] = mapped_column(ForeignKey("topics.id"))
    language_id: Mapped[Optional[int]] = mapped_column(ForeignKey("languages.id"))
    created_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    questions: Mapped[list["QuizQuestion"]] = relationship(back_populates="quiz")


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id: Mapped[int] = mapped_column(primary_key=True)
    quiz_id: Mapped[int] = mapped_column(ForeignKey("quizzes.id"), nullable=False)
    question: Mapped[str] = mapped_column(Text, nullable=False)
    options: Mapped[list] = mapped_column(JSONB, nullable=False)
    correct_answer: Mapped[int] = mapped_column(nullable=False)
    explanation: Mapped[Optional[str]] = mapped_column(Text)
    order_index: Mapped[Optional[int]] = mapped_column(default=0)
    quiz: Mapped["Quiz"] = relationship(back_populates="questions")


class SyntaxLesson(Base):
    __tablename__ = "syntax_lessons"

    id: Mapped[int] = mapped_column(primary_key=True)
    language_id: Mapped[int] = mapped_column(ForeignKey("languages.id"), nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    concept: Mapped[str] = mapped_column(Text, nullable=False)
    raw_syntax: Mapped[Optional[str]] = mapped_column("raw_syntax", Text)
    explanation: Mapped[Optional[str]] = mapped_column(Text)
    real_world_example: Mapped[Optional[str]] = mapped_column("real_world_example", Text)
    github_project: Mapped[Optional[str]] = mapped_column("github_project", Text)
    github_url: Mapped[Optional[str]] = mapped_column("github_url", Text)
    difficulty: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[Optional[str]] = mapped_column(Text)
    order_index: Mapped[Optional[int]] = mapped_column(default=0)
    created_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)
