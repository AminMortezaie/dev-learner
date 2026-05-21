# DevLearn Hub

A developer learning platform for tracking progress across programming languages and topics. Features AI-powered article polish, auto-generated quizzes, syntax lessons, and curated resources.

## Features

- **Learning Tracks** — Organized by language (Go, Python, Java, Kotlin, System Design)
- **Articles** — Write articles in Markdown; polish raw text with AI
- **AI Quiz Generation** — Auto-generates quizzes from articles
- **Polish with AI** — Paste raw text; AI reformats it as clean Markdown
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

The API container runs: `pip install` → `python -m app.cli push` → `python -m app.cli seed` → Uvicorn.

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

Set **Root Directory** to `apps/api` and link your Render Postgres database so `DATABASE_URL` is available at build and runtime.

| Setting | Command |
|---|---|
| **Build Command** | `pip install -r requirements.txt && python -m app.cli setup` |
| **Start Command** | `python -m app.cli seed && uvicorn app.main:app --host 0.0.0.0 --port $PORT` |

`setup` runs `push` (create tables) then `seed` (load curated data **only if the database is empty**). `seed` on start is a fast no-op when data already exists, so restarts stay safe.

Environment variables: `DATABASE_URL`, `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL`. Render sets `PORT`.

If the service root must stay at the repo root:

```bash
# Build
pip install -r apps/api/requirements.txt && cd apps/api && python -m app.cli setup

# Start
cd apps/api && python -m app.cli seed && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### GitHub Pages (frontend)

Workflow: [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml). Set secret `VITE_API_URL` to your Render API URL.

## Backend layout (`apps/api`)

```
apps/api/
├── app/
│   ├── main.py           # FastAPI app
│   ├── cli.py            # python -m app.cli push | seed | setup
│   ├── models.py         # SQLAlchemy schema (source of truth)
│   ├── schemas.py        # Pydantic API models
│   ├── routers/          # HTTP handlers
│   ├── services/         # Business logic
│   ├── ai/               # LLM quiz + polish
│   └── seed/
│       ├── runner.py
│       └── data/*.json   # Curated seed content
├── tests/
├── requirements.txt
└── Makefile
```

## Adding an API endpoint

1. Update `packages/contract/openapi.yaml`
2. `pnpm --filter @devlearn/contract run codegen` (web client)
3. Add Pydantic models in `apps/api/app/schemas.py`
4. Implement router + service in `apps/api/app/`
5. Add a test in `apps/api/tests/`

## License

MIT
