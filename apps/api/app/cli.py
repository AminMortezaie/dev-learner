"""DevLearn API CLI: database setup and seed (no Node/pnpm required)."""

from __future__ import annotations

import argparse
import sys

from sqlalchemy import select, text

from app.db import Base, _ensure_engine, get_engine
from app.models import Language, Project, ProjectStep
from app.seed.runner import _seed_projects, run_seed


def cmd_push() -> None:
    _ensure_engine()
    print("[db] creating tables from SQLAlchemy models")
    Base.metadata.create_all(bind=get_engine())
    print("[db] done")


def cmd_seed() -> None:
    factory = _ensure_engine()
    db = factory()
    try:
        run_seed(db)
    finally:
        db.close()


def cmd_reseed_projects() -> None:
    """Drop and recreate project tables, then load curated projects from JSON."""
    _ensure_engine()
    engine = get_engine()
    with engine.begin() as conn:
        conn.execute(text("DROP TABLE IF EXISTS project_steps CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS projects CASCADE"))
    Project.__table__.create(engine, checkfirst=True)
    ProjectStep.__table__.create(engine, checkfirst=True)
    factory = _ensure_engine()
    db = factory()
    try:
        langs = {lang.slug: lang for lang in db.scalars(select(Language)).all()}
        _seed_projects(db, langs)
        db.commit()
        print("[cli] projects reseeded")
    finally:
        db.close()


def cmd_setup() -> None:
    """Apply schema and seed curated data (seed is skipped if languages already exist)."""
    cmd_push()
    cmd_seed()


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="DevLearn API database tools")
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("push", help="Create tables from SQLAlchemy models")
    sub.add_parser("seed", help="Insert seed data if the database is empty")
    sub.add_parser(
        "setup",
        help="Run push then seed (use on deploy/build; seed only when DB is empty)",
    )
    sub.add_parser(
        "reseed-projects",
        help="Drop project tables and reload build-project seed data",
    )

    args = parser.parse_args(argv)
    if args.command == "push":
        cmd_push()
    elif args.command == "seed":
        cmd_seed()
    elif args.command == "setup":
        cmd_setup()
    elif args.command == "reseed-projects":
        cmd_reseed_projects()
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as err:
        print(f"[cli] {err}", file=sys.stderr)
        raise SystemExit(1) from err
