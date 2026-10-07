# Yapi

[![CI](https://github.com/Yero123/yapi/actions/workflows/ci.yml/badge.svg)](https://github.com/Yero123/yapi/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

Personal finance for people who have never tracked their money. Record expenses and incomes, cap a category with a monthly limit to turn it into a budget, and ask an assistant about your month. No account needed: the first visit creates an anonymous guest.

> **Live:** https://yapi-finance.vercel.app. Still a work in progress; see [`openspec/changes/`](openspec/changes) for what is planned and what is done.

## Features

- **Transactions**: expenses and incomes with create, edit, delete and filters by type, category and month.
- **Categories and budgets**: name, icon, color and type; an optional monthly limit makes a category a budget.
- **Dashboard**: budget progress, income vs expenses over 12 months, spending by category, recent movements.
- **Assistant**: type "spent 12 on lunch" or "how much did I spend on food?" and it creates the record or answers from your data.
- **Guest sessions**: works without sign-in; data is scoped to an anonymous id kept in the browser.

## Architecture

```mermaid
flowchart LR
    B[Browser] -->|static app| F[frontend<br/>React + Vite]
    B -->|/api, X-Guest-Id| A[backend<br/>FastAPI]
    A --> S[services]
    S --> D[(PostgreSQL)]
    A -->|SSE stream| G[LangGraph agent]
    G -->|tools| S
    G --> L[LLM<br/>OpenAI-compatible API]
```

| Part | Stack |
| --- | --- |
| `frontend/` | React 19, Vite, TypeScript, Tailwind 4, shadcn/ui, TanStack Query, Recharts |
| `backend/` | Python 3.11, FastAPI, SQLAlchemy 2, Alembic, LangGraph, pytest |
| Database | PostgreSQL 16 |
| LLM | OpenAI by default; any OpenAI-compatible provider through configuration |

Routers and assistant tools both call the same service layer, so every rule has one implementation. Amounts are stored as integer cents.

## Run locally

Requirements: Docker, [uv](https://docs.astral.sh/uv/), Node 22 and pnpm 9.

```bash
# 1. Database
docker compose up -d

# 2. Backend (http://localhost:8000, API docs at /docs)
cd backend
cp .env.example .env        # then fill in LLM_API_KEY if you want the assistant
uv sync
uv run alembic upgrade head
uv run uvicorn app.main:app --reload

# 3. Frontend (http://localhost:5173)
cd frontend
pnpm install
pnpm dev
```

The Vite dev server proxies `/api` to the backend, so there is nothing to configure on the frontend.

## Configuration

All backend settings are environment variables, read from `backend/.env` in development. Every one has a default that suits local development except the LLM key.

| Variable | Default | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | `postgresql+psycopg://yapi:yapi@localhost:5432/yapi` | SQLAlchemy connection string |
| `CORS_ORIGINS` | `http://localhost:5173` | Comma-separated allowed origins |
| `LLM_API_KEY` | empty | Provider key. Without it everything works except the assistant |
| `LLM_BASE_URL` | `https://api.openai.com/v1` | OpenAI-compatible endpoint |
| `LLM_MODEL` | `gpt-4.1-mini` | Model name; must support tool calling |
| `SEED_SAMPLE_DATA` | `true` | New guests start with example budgets, a year of transactions and a sample chat |
| `CHAT_MAX_MESSAGE_CHARS` | `1000` | Longest chat message accepted |
| `CHAT_RATE_LIMIT_PER_MINUTE` | `20` | Chat messages per guest per minute |
| `CHAT_HISTORY_WINDOW` | `20` | Past messages sent to the model |
| `GUEST_RATE_LIMIT_PER_HOUR_PER_IP` | `10` | New guests one address can create per hour |
| `CHAT_RATE_LIMIT_PER_HOUR_PER_IP` | `60` | Chat messages one address can send per hour, across guests |
| `SEED_SAMPLE_DATA` | `true` | New guests start with example data |

Never commit a `.env` file. `backend/.env.example` lists the names with safe values.

## Tests and checks

```bash
cd backend && uv run pytest          # API and service tests, on in-memory SQLite
cd frontend && pnpm lint && pnpm build
```

The same commands run in [CI](.github/workflows/ci.yml) on every pull request.

## Deployment

Live at https://yapi-finance.vercel.app. Details in [`openspec/changes/add-production-deployment`](openspec/changes/add-production-deployment):

| Part | Host | Notes |
| --- | --- | --- |
| Frontend | Vercel | Built from `frontend/`; `/api/*` is proxied to the backend so the browser stays on one origin |
| Backend | Railway | Container from `backend/Dockerfile`; `alembic upgrade head` runs before each release |
| Database | Supabase | Plain PostgreSQL through the session pooler; tables closed to the public Data API |

`main` deploys automatically on push. Secrets live only in the host's environment variables.

## Project layout

```
backend/
  app/api/        routers
  app/services/   business rules shared by routers and assistant tools
  app/chat/       LangGraph agent and its tools
  alembic/        migrations
  tests/
frontend/
  src/components/ UI components and dialogs
  src/lib/        API client, queries, formatting
openspec/         specs and change proposals
PRODUCT.md        product brief
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). To report a vulnerability, follow [SECURITY.md](SECURITY.md) instead of opening an issue.

## License

[MIT](LICENSE)
