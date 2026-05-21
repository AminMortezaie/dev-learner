"""Projects tables: code_language + snippets JSON (migrate legacy editor/starter/solution).

Revision ID: 002_projects_snippets
Revises: 001_initial
Create Date: 2026-05-21

"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

from app.db import Base
from app.models import Project, ProjectStep

revision: str = "002_projects_snippets"
down_revision: Union[str, None] = "001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _project_tables_current(inspector: sa.Inspector) -> bool:
    if not inspector.has_table("projects") or not inspector.has_table("project_steps"):
        return False
    project_cols = {c["name"] for c in inspector.get_columns("projects")}
    step_cols = {c["name"] for c in inspector.get_columns("project_steps")}
    return "code_language" in project_cols and "snippets" in step_cols


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if _project_tables_current(inspector):
        return

    if inspector.has_table("project_steps"):
        op.drop_table("project_steps")
    if inspector.has_table("projects"):
        op.drop_table("projects")

    Base.metadata.create_all(bind, tables=[Project.__table__, ProjectStep.__table__])


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if inspector.has_table("project_steps"):
        op.drop_table("project_steps")
    if inspector.has_table("projects"):
        op.drop_table("projects")
