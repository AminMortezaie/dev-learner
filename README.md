# DevLearn Hub

A developer learning platform for tracking progress across programming languages and topics. Features AI-powered article import, auto-generated quizzes, syntax lessons, and curated resources.

## Features

- **Learning Tracks** — Organized by language (Go, Python, Java, Kotlin, System Design)
- **Articles** — Write or import from any URL; AI extracts and structures the content
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
pnpm --filter @workspace/api-server dev
pnpm --filter @workspace/devlearn dev
```

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
├── artifacts/
│   ├── api-server/        # Express API (TypeScript)
│   │   └── src/
│   │       ├── lib/       # AI, error handling, helpers
│   │       ├── routes/    # REST endpoints
│   │       └── seed/      # Database seed data
│   └── devlearn/          # React frontend
│       └── src/
│           ├── components/
│           └── pages/
├── lib/
│   ├── api-client-react/  # Generated API client + hooks
│   ├── api-spec/          # OpenAPI spec
│   ├── api-zod/           # Zod schemas
│   └── db/                # Drizzle schema + migrations
├── docker-compose.yml
└── .env.example
```

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/articles` | List articles |
| `POST` | `/api/articles` | Create article (auto-generates quiz) |
| `POST` | `/api/articles/from-url` | Import article from URL |
| `POST` | `/api/articles/polish` | Polish raw text with AI |
| `GET` | `/api/quizzes/:id` | Get quiz with questions |
| `POST` | `/api/quizzes/:id/attempt` | Submit quiz answers |
| `GET` | `/api/languages` | List language tracks |
| `GET` | `/api/syntax` | List syntax lessons |
| `GET` | `/api/dashboard/stats` | Dashboard statistics |

## License

MIT
