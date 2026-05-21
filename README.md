# DevLearn Hub

A developer learning platform for tracking progress across programming languages and topics. Features AI-powered article import, auto-generated quizzes, syntax lessons, and curated resources.

## Features

- **Learning Tracks** — Organized by language (Go, Python, Java, Kotlin, System Design)
- **Articles** — Write articles in Markdown; polish raw text with AI
- **AI Quiz Generation** — Auto-generates 10-question quizzes from articles
- **Polish with AI** — Paste raw text, AI reformats it as clean Markdown
- **Syntax Lessons** — Side-by-side code examples with syntax highlighting
- **Resources** — Curated links to articles, videos, docs, courses
- **Mobile Responsive** — Full mobile support with hamburger nav drawer

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| Backend | Node.js, Express 5, TypeScript, Drizzle ORM |
| Database | PostgreSQL 16 |
| AI | Groq / OpenAI-compatible API |
| Dev | Docker Compose, pnpm workspaces |

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

   Edit `.env` and fill in your API key:

   ```env
   AI_BASE_URL=https://api.groq.com/openai/v1
   AI_API_KEY=your_groq_key_here
   AI_MODEL=llama-3.3-70b-versatile
   ```

3. **Start the stack**

   ```bash
   docker compose up
   ```

   This starts:
   - `http://localhost:5174` — Frontend (Vite dev server)
   - `http://localhost:5051` — API server
   - `localhost:5432` — PostgreSQL

   The database is seeded automatically on first run.

### Local Development (without Docker)

```bash
pnpm install
cp .env.example .env   # fill in your values

# In separate terminals:
pnpm --filter @devlearn/api dev
pnpm --filter @devlearn/web dev
```

### API smoke tests

Requires `DATABASE_URL` (same as the API server):

```bash
pnpm --filter @devlearn/api test
```

Without a database, tests are skipped automatically.

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | required |
| `AI_BASE_URL` | OpenAI-compatible API base URL | `https://api.openai.com/v1` |
| `AI_API_KEY` | API key (Groq, OpenAI, Ollama, etc.) | required for AI features |
| `AI_MODEL` | Model name | `gpt-4o-mini` |

### Supported AI Providers

| Provider | Base URL | Notes |
|---|---|---|
| [Groq](https://console.groq.com/) | `https://api.groq.com/openai/v1` | Free tier, fast |
| OpenAI | `https://api.openai.com/v1` | Paid |
| Ollama | `http://localhost:11434/v1` | Local, no key needed |

## Project Structure

```
.
├── apps/
│   ├── api/                  # Express API (deployable)
│   │   └── src/
│   │       ├── routes/       # Thin HTTP handlers
│   │       ├── services/     # Business logic
│   │       ├── lib/          # AI, errors, helpers
│   │       └── seed/         # Database seed data
│   └── web/                  # React frontend (deployable)
│       └── src/
│           ├── pages/        # Route entrypoints
│           └── components/   # Layout + shadcn UI
├── packages/
│   ├── contract/             # OpenAPI spec + codegen (source of truth)
│   ├── api-zod/              # Generated Zod validators (server)
│   ├── api-client/           # Generated React Query hooks (client)
│   └── database/             # Drizzle schema + migrations
├── scripts/                  # Repo tooling (PWA icons, etc.)
├── docker-compose.yml
└── .env.example
```

## API contract and codegen

The API contract lives in [`packages/contract/openapi.yaml`](packages/contract/openapi.yaml). After editing it:

```bash
pnpm --filter @devlearn/contract run codegen
```

This regenerates:

- [`packages/api-zod`](packages/api-zod) — request/response validation for the API server
- [`packages/api-client`](packages/api-client) — hooks and types for the frontend

### Adding an endpoint

1. Add the path and schemas to `packages/contract/openapi.yaml`
2. Run `pnpm --filter @devlearn/contract run codegen`
3. Implement a thin route in `apps/api/src/routes/` that validates with `@devlearn/api-zod` and delegates to `services/`
4. Use the generated hook in `apps/web/src/features/` or `pages/`
5. Add a smoke test in `apps/api/src/app.test.ts` when practical

## API Endpoints

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
