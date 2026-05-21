"""DevLearn API CLI: database setup and seed (no Node/pnpm required)."""

from __future__ import annotations

import argparse
import sys

from sqlalchemy import select, text

from app.db import Base, _ensure_engine, get_engine
from app.migrate import run_migrations
from app.models import Language, Project, ProjectStep
from app.seed.runner import _seed_projects, run_seed


def cmd_migrate() -> None:
    _ensure_engine()
    print("[db] applying alembic migrations")
    run_migrations()
    print("[db] migrations done")


def cmd_push() -> None:
    """Deprecated alias: use migrate."""
    cmd_migrate()


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
    """Apply migrations and seed curated data (full seed only if DB is empty)."""
    cmd_migrate()
    cmd_seed()


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="DevLearn API database tools")
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("migrate", help="Apply Alembic migrations to head")
    sub.add_parser("push", help="Alias for migrate (deprecated)")
    sub.add_parser("seed", help="Seed curated data (projects refresh when DB has languages)")
    sub.add_parser(
        "setup",
        help="Run migrate then seed (use on deploy/build)",
    )
    sub.add_parser(
        "reseed-projects",
        help="Drop project tables and reload build-project seed data",
    )

    args = parser.parse_args(argv)
    if args.command == "migrate":
        cmd_migrate()
    elif args.command == "push":
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
