"""DevLearn API CLI: database setup and seed (no Node/pnpm required)."""

from __future__ import annotations

import argparse
import sys

from app.db import Base, _ensure_engine, get_engine
from app.seed.runner import run_seed


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

    args = parser.parse_args(argv)
    if args.command == "push":
        cmd_push()
    elif args.command == "seed":
        cmd_seed()
    elif args.command == "setup":
        cmd_setup()
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as err:
        print(f"[cli] {err}", file=sys.stderr)
        raise SystemExit(1) from err
