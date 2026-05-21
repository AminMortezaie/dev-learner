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
| Backend | Node.js, Express 5, TypeScript, Drizzle ORM |
| Database | PostgreSQL 16 |
| API contract | OpenAPI 3 + Orval (Zod + React Query client) |
| AI | Groq / OpenAI-compatible API |
| Dev | Docker Compose, pnpm workspaces |

## Monorepo packages

| Package | Path | Role |
|---|---|---|
| `@devlearn/api` | `apps/api` | Express API (production deploy on Render) |
| `@devlearn/web` | `apps/web` | React SPA (production deploy on GitHub Pages) |
| `@devlearn/contract` | `packages/contract` | OpenAPI spec + codegen entrypoint |
| `@devlearn/api-zod` | `packages/api-zod` | Generated request/response validators |
| `@devlearn/api-client` | `packages/api-client` | Generated React Query hooks |
| `@devlearn/database` | `packages/database` | Drizzle schema + `drizzle-kit push` |

## Getting Started

### Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose
- [pnpm](https://pnpm.io/) (v9+)
- A free [Groq API key](https://console.groq.com/) (or any OpenAI-compatible provider)

### Setup

1. **Clone the repo**

   ```bash
   git clone https://github.com/AminMortezaie/dev-learner.git
   cd dev-learner
   ```

2. **Configure environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set your AI key (and `DATABASE_URL` if running without Docker):

   ```env
   DATABASE_URL=postgres://devlearn:devlearn@localhost:5432/devlearn
   AI_BASE_URL=https://api.groq.com/openai/v1
   AI_API_KEY=your_groq_key_here
   AI_MODEL=llama-3.3-70b-versatile
   ```

3. **Start the stack**

   ```bash
   docker compose up
   ```

   This starts:

   | URL | Service |
   |---|---|
   | http://localhost:5174 | Frontend (Vite dev server) |
   | http://localhost:5051 | API server |
   | localhost:5432 | PostgreSQL |

   On first run, Compose applies the schema (`drizzle push`) and seeds the database automatically.

### Local development (without Docker)

```bash
pnpm install
cp .env.example .env   # fill in DATABASE_URL and AI_* values

# Separate terminals:
pnpm --filter @devlearn/api dev
pnpm --filter @devlearn/web dev
```

The web dev server proxies `/api` to the API (see `API_PROXY_TARGET` in `docker-compose.yml`; locally, Vite uses the same pattern when configured).

### Root scripts

| Command | Description |
|---|---|
| `pnpm run typecheck` | Typecheck workspace libs + apps |
| `pnpm run build` | Typecheck, then build API and web |
| `pnpm test` | API smoke tests (`apps/api`) |

Web production build requires env vars:

```bash
PORT=5174 BASE_PATH=/ pnpm --filter @devlearn/web build
```

### API smoke tests

Tests live in `apps/api/src/app.test.ts` (Vitest + supertest). They run when `DATABASE_URL` is set; otherwise all three tests are skipped.

```bash
# Host (needs Postgres reachable at DATABASE_URL)
pnpm test

# Inside Docker (recommended if another Postgres uses port 5432)
docker exec devlearn-api sh -c \
  'DATABASE_URL=postgres://devlearn:devlearn@postgres:5432/devlearn pnpm --filter @devlearn/api test'
```

## Deployment

Production uses two services:

| Component | Host | Package |
|---|---|---|
| API + database migrations | [Render](https://render.com) | `@devlearn/api`, `@devlearn/database` |
| Static frontend | GitHub Pages | `@devlearn/web` |

### Render (API)

In the Render service settings, use these commands (not the legacy `@workspace/*` names):

**Build command:**

```bash
pnpm install --frozen-lockfile=false && pnpm --filter @devlearn/api build
```

**Start command:**

```bash
pnpm --filter @devlearn/database run push && pnpm --filter @devlearn/api start
```

**Environment variables:** `DATABASE_URL` (from Render Postgres), plus optional `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL`. Render sets `PORT` automatically.

### GitHub Pages (frontend)

Workflow: [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml). On push to `main`, it builds `@devlearn/web` with:

- `BASE_PATH=/dev-learner/`
- `VITE_API_URL` from repository secret (your Render API URL, e.g. `https://dev-learner.onrender.com`)

Add `VITE_API_URL` under **Settings → Secrets and variables → Actions** in the GitHub repo.

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | required for API / tests |
| `PORT` | API listen port (Render sets this) | `5000` locally |
| `AI_BASE_URL` | OpenAI-compatible API base URL | `https://api.openai.com/v1` |
| `AI_API_KEY` | API key (Groq, OpenAI, Ollama, etc.) | required for AI features |
| `AI_MODEL` | Model name | `gpt-4o-mini` |
| `BASE_PATH` | Vite base path (web build) | `/` in Docker, `/dev-learner/` on Pages |
| `VITE_API_URL` | Production API origin (web only) | unset in dev (uses proxy) |

### Supported AI providers

| Provider | Base URL | Notes |
|---|---|---|
| [Groq](https://console.groq.com/) | `https://api.groq.com/openai/v1` | Free tier, fast |
| OpenAI | `https://api.openai.com/v1` | Paid |
| Ollama | `http://localhost:11434/v1` | Local, no key needed |

When `AI_API_KEY` is unset, quiz and article generation use a deterministic fallback.

## Project structure

```
.
├── apps/
│   ├── api/                      # Express API
│   │   └── src/
│   │       ├── routes/           # Thin HTTP handlers
│   │       ├── services/         # Business logic
│   │       ├── lib/              # AI, errors, logging
│   │       └── seed/             # Database seed data
│   └── web/                      # React frontend
│       └── src/
│           ├── pages/            # Route entrypoints (thin re-exports)
│           ├── features/         # Feature modules (e.g. articles/)
│           ├── shared/           # Shared config, PWA helpers
│           └── components/       # Layout + shadcn UI
├── packages/
│   ├── contract/                 # OpenAPI spec (source of truth)
│   ├── api-zod/                  # Generated Zod validators
│   ├── api-client/               # Generated React Query hooks
│   └── database/                 # Drizzle schema
├── scripts/                      # Repo tooling (PWA icons)
├── docker-compose.yml
└── .env.example
```

## API contract and codegen

The contract lives in [`packages/contract/openapi.yaml`](packages/contract/openapi.yaml). After editing it:

```bash
pnpm --filter @devlearn/contract run codegen
```

This regenerates:

- [`packages/api-zod`](packages/api-zod) — validation for API routes
- [`packages/api-client`](packages/api-client) — hooks and types for the frontend

Codegen also runs `pnpm run typecheck:libs` to verify generated TypeScript.

### Adding an endpoint

1. Add the path and schemas to `packages/contract/openapi.yaml`
2. Run `pnpm --filter @devlearn/contract run codegen`
3. Add a thin route in `apps/api/src/routes/` that validates with `@devlearn/api-zod` and delegates to `services/`
4. Use the generated hook in `apps/web/src/features/` or `pages/`
5. Add a smoke test in `apps/api/src/app.test.ts` when practical

## API endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/healthz` | Health check |
| `GET` | `/api/articles` | List articles |
| `POST` | `/api/articles` | Create article (auto-generates quiz) |
| `POST` | `/api/articles/polish` | Polish raw text with AI |
| `GET` | `/api/quizzes/:id` | Get quiz with questions |
| `POST` | `/api/quizzes/:id/attempt` | Submit quiz answers |
| `GET` | `/api/languages` | List language tracks |
| `GET` | `/api/syntax` | List syntax lessons |
| `GET` | `/api/dashboard/stats` | Dashboard statistics |

> **Note:** URL-based article import (`POST /api/articles/from-url`) is not implemented yet.

## License

MIT
