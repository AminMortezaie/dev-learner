# DevLearn Hub

A developer learning platform for tracking progress across programming languages and topics. Features AI-powered article polish, auto-generated quizzes, syntax lessons, and curated resources.

## Features

- **Learning Tracks** — Organized by language (Go, Python, Java, Kotlin, System Design)
- **Articles** — Write articles in Markdown; polish raw text with AI
- **AI Quiz Generation** — Auto-generates quizzes from articles
- **Polish with AI** — Paste raw text; AI reformats it as clean Markdown
- **Build Projects** — 32 curated zero-to-hero walkthroughs (8 per language track) with per-step read-only code snippets and local progress
- **Syntax Lessons** — Side-by-side code examples with syntax highlighting
- **Resources** — Curated links to articles, videos, docs, and courses
- **Mobile Responsive** — Full mobile support with hamburger nav drawer

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| Backend | **Python 3.12+**, FastAPI, SQLAlchemy, Uvicorn |
| Database | PostgreSQL 16 |
| API contract | OpenAPI 3 + Orval (React Query client for the web only) |
| AI | Groq / OpenAI-compatible API |
| Dev | Docker Compose; pnpm for frontend + client codegen only |

The backend is **Python-only** — no Node.js, Express, Drizzle, or `package.json` under `apps/api`.

## Repository layout

| Path | Role |
|---|---|
| `apps/api/` | FastAPI server, SQLAlchemy models, seed JSON, `Makefile` |
| `apps/web/` | React SPA (`@devlearn/web`) |
| `packages/contract/` | OpenAPI spec + Orval codegen |
| `packages/api-client/` | Generated React Query hooks |
| `scripts/generate-pwa-icons.mjs` | Optional PWA asset helper (frontend tooling) |

## Getting Started

### Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose, **or**
- Python 3.12+, PostgreSQL 16, and [pnpm](https://pnpm.io/) (frontend only)
- A free [Groq API key](https://console.groq.com/) (optional, for AI features)

### Environment

```bash
cp .env.example .env
```

```env
DATABASE_URL=postgres://devlearn:devlearn@localhost:5432/devlearn
AI_BASE_URL=https://api.groq.com/openai/v1
AI_API_KEY=your_groq_key_here
AI_MODEL=llama-3.3-70b-versatile
```

### Docker (recommended)

```bash
docker compose up
```

| URL | Service |
|---|---|
| http://localhost:5174 | Frontend |
| http://localhost:5051 | API |
| localhost:5432 | PostgreSQL |

The API container runs: `pip install` → `python -m app.cli setup` (migrate + seed) → Uvicorn.

### Local development

**API (Python only):**

```bash
cd apps/api
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
export DATABASE_URL=postgres://devlearn:devlearn@localhost:5432/devlearn

make setup   # create tables + seed JSON (skips seed if data already exists)
make dev     # uvicorn --reload on :5051
```

**PyCharm / IntelliJ:** If you see hundreds of “Unresolved reference” errors on `pydantic`, `datetime`, etc., the IDE is not using the API virtualenv. Open **Settings → Project → Python Interpreter**, choose **Add Interpreter → Local**, and point it at `apps/api/.venv/bin/python`. Mark `apps/api` as the content root (or open `apps/api` as the project root for backend work). The code is fine; the linter just has no interpreter with dependencies installed.

**Frontend (pnpm):**

```bash
pnpm install
pnpm --filter @devlearn/web dev
```

**Regenerate API client after OpenAPI changes:**

```bash
pnpm --filter @devlearn/contract run codegen
```

### Tests

```bash
cd apps/api
pip install -r requirements.txt
DATABASE_URL=postgres://devlearn:devlearn@localhost:5432/devlearn make test
```

## Deployment

### Render (API) — Python only

Link your Render Postgres database so `DATABASE_URL` is available at build and runtime. Set **Root Directory** to `apps/api`.

| Setting | Command |
|---|---|
| **Build Command** | `pip install -r requirements.txt && python -m app.cli migrate` |
| **Start Command** | `python -m app.cli migrate && python -m app.cli seed && uvicorn app.main:app --host 0.0.0.0 --port $PORT` |

**Migrations** (`apps/api/alembic/`) run automatically via `python -m app.cli migrate` on deploy (Alembic `upgrade head`). This applies schema changes (including legacy project table upgrades) without manual Shell commands.

`seed` on start loads full curated data if the DB is empty; otherwise it **refreshes build projects** from `seed/data/projects/*.json`. Articles, quizzes, and topics are not wiped.

Environment variables: `DATABASE_URL`, `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL`. Render sets `PORT`.

### GitHub Pages (frontend)

Workflow: [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml). Set secret `VITE_API_URL` to your Render API URL.

## Backend layout (`apps/api`)

```
apps/api/
├── app/
│   ├── main.py           # FastAPI app
│   ├── cli.py            # python -m app.cli migrate | seed | setup
│   ├── alembic/          # DB migrations (auto-run on deploy)
│   ├── models.py         # SQLAlchemy schema (source of truth)
│   ├── schemas.py        # Pydantic API models
│   ├── routers/          # HTTP handlers
│   ├── services/         # Business logic
│   ├── ai/               # LLM quiz + polish
│   └── seed/
│       ├── runner.py
│       └── data/         # Curated seed JSON (+ projects/*.json, 8 per language)
├── tests/
├── requirements.txt
└── Makefile
```

## Build project seed (Wave 1)

- `apps/api/seed/data/projects/golang.json` — 8 Go projects
- `apps/api/seed/data/projects/java.json` — 8 Java projects
- `apps/api/seed/data/projects/kotlin.json` — 8 Kotlin projects
- `apps/api/seed/data/projects/python.json` — 8 Python projects

Regenerate JSON: `python3 apps/api/seed/generate_wave1_projects.py` and `python3 apps/api/seed/generate_wave1_jkp.py`.

Schema: `python -m app.cli migrate`. Project content reloads on each API start via `seed` (or `reseed-projects` to force-drop project tables).

## Adding an API endpoint

1. Update `packages/contract/openapi.yaml`
2. `pnpm --filter @devlearn/contract run codegen` (web client)
3. Add Pydantic models in `apps/api/app/schemas.py`
4. Implement router + service in `apps/api/app/`
5. Add a test in `apps/api/tests/`

## License

MIT
