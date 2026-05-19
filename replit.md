# Dev-Learn-Hub

A senior-developer learning platform: System Design, Java, Kotlin, Go, and Python — with curated topics, syntax lessons linked to real-world GitHub projects (Kubernetes, Docker, Spring, Ktor, FastAPI, …), articles, and senior-level quizzes. Adding an article auto-generates a quiz (OpenAI when `OPENAI_API_KEY` is set, deterministic fallback otherwise).

## Run & Operate

First-time setup:

1. `docker compose up -d` — start Postgres 16 on `localhost:5432` (user/password/db = `devlearn`).
2. `cp .env.example .env` and `export DATABASE_URL=postgres://devlearn:devlearn@localhost:5432/devlearn` (or `source .env`).
3. `pnpm install`
4. `pnpm --filter @workspace/db run push` — create tables.
5. `pnpm --filter @workspace/api-server run seed` — populate with curated content.
6. `pnpm --filter @workspace/api-server run dev` — start the API on port 5000.
7. `pnpm --filter @workspace/devlearn run dev` — start the Vite frontend.

Other commands:

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- Optional env: `OPENAI_API_KEY` to enable real LLM article-quiz generation (`OPENAI_MODEL` defaults to `gpt-4o-mini`).

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

_Populate as you build — non-obvious choices a reader couldn't infer from the code (3-5 bullets)._

## Product

_Describe the high-level user-facing capabilities of this app once they exist._

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
