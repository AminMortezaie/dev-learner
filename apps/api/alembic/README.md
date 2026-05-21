# Database migrations

Schema changes are managed with [Alembic](https://alembic.sqlalchemy.org/). Migrations run automatically:

- **Render build:** `python -m app.cli migrate`
- **Render start / local prod:** `migrate` in start command + on FastAPI startup
- **Docker:** `python -m app.cli setup` (migrate + seed)

## Commands

```bash
cd apps/api
export DATABASE_URL=postgres://...

python -m app.cli migrate          # upgrade to head
alembic current                   # show revision
alembic history                   # list revisions
```

## Revisions

| Revision | Purpose |
|----------|---------|
| `001_initial` | Create all tables on empty DB (no-op if `languages` already exists) |
| `002_projects_snippets` | Rebuild `projects` / `project_steps` for `code_language` + `snippets` JSON |

Project **content** (32 walkthroughs) is loaded by `python -m app.cli seed`, not by migrations.

## New migration

```bash
cd apps/api
alembic revision -m "describe_change"
# edit alembic/versions/...
alembic upgrade head
```
