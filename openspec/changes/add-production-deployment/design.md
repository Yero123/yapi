## Context

Yapi is two projects in one repo: `frontend/` (Vite, React, static build) and `backend/` (FastAPI, synchronous SQLAlchemy with `psycopg`, Alembic, a LangGraph agent that streams Server-Sent Events from `POST /api/chat`). Locally PostgreSQL comes from `docker-compose.yml` and Vite proxies `/api` to `localhost:8000`.

What exists on the owner's accounts, checked on 2026-10-06:

- GitHub: `Yero123` is logged in to `gh` but is not the active account (`Yerodin-bgm`, a work account, is). `Yero123/yapi` does not exist. The repo's git author is the work identity.
- Vercel: team `yero123s-projects`. Railway: user `yero123`, no workspace selected. Supabase: project `dqyeeijsqcwhlulgewzf`, `public` schema empty.
- The Supabase and Vercel MCP servers are configured in `.mcp.json`; Railway's is configured globally.

Constraints from the code:

- The frontend calls a relative `/api` everywhere (`frontend/src/lib/api.ts`), including the streaming chat call.
- The chat rate limit is an in-memory dict in `backend/app/api/chat.py`, so it is only correct with one backend process.
- `POST /api/guests` is unauthenticated and unlimited, and the chat limit is per guest. A script can mint guests and bypass the limit.
- `GET /api/health` returns ok without touching the database.

## Goals / Non-Goals

**Goals:**

- A public URL where the whole app works, including streamed chat.
- `main` is always what is deployed; nothing is deployed by hand.
- No secret ever enters the repository, which is public.
- A stranger cannot run up an unbounded LLM bill.
- Local development keeps working exactly as it does now.

**Non-Goals:**

- Custom domain, staging environment, multi-region, autoscaling.
- Error tracking, analytics, uptime alerting.
- Infrastructure as code. Three services are configured once through their dashboards or MCP servers and recorded in the README.
- Supabase Auth, Storage or client-side Supabase access. Supabase is used as plain PostgreSQL.

## Decisions

### Hosting: Vercel + Railway + Supabase

```
browser ──> Vercel (static frontend)
              └─ /api/* rewrite ──> Railway (FastAPI container, 1 instance)
                                       ├──> Supabase PostgreSQL (session pooler)
                                       └──> MiniMax API
```

- Frontend on Vercel: a static Vite build with previews per pull request, already connected through MCP.
- Backend on Railway as a long-running container.
  - Why not Vercel Functions for FastAPI: the app holds an in-memory rate limiter and a SQLAlchemy connection pool, and streams agent runs that can take tens of seconds. A single always-on process keeps all three simple. Serverless would need an external store for the limiter and per-invocation connection handling.
  - Why not Supabase Edge Functions: they run Deno, not Python.
- Database on Supabase: the project already exists and is free at this size. Railway PostgreSQL would also work and removes one vendor; Supabase was chosen because the owner provisioned it for this app.

### Same-origin `/api` through a Vercel rewrite

`frontend/vercel.json` rewrites `/api/:path*` to the Railway public URL and everything else to `index.html` (React Router). The browser only ever talks to the Vercel origin.

- Why not a `VITE_API_URL` plus CORS: it needs a frontend code change, a CORS allow-list that must track every preview URL, and a preflight on each request. The rewrite needs none of that and keeps previews working against the production API.
- Trade-off: requests take an extra hop and are subject to Vercel's proxy timeout. The first deployment task verifies that a streamed chat reply arrives token by token through the rewrite; if it is buffered or cut off, fall back to `VITE_API_URL` and CORS for the chat call only.
- The backend's `CORS_ORIGINS` is set to the Vercel production URL anyway, so a direct call from the app's origin is still allowed.

### Backend container

`backend/Dockerfile`: `python:3.11-slim`, `uv sync --frozen --no-dev` from `uv.lock`, run as a non-root user, start `uvicorn app.main:app --host 0.0.0.0 --port $PORT --proxy-headers --forwarded-allow-ips='*'` with a single worker. Railway builds it with the service root directory set to `backend/`.

The deploy settings live on the Railway service: root directory `/backend`, pre-deploy command `alembic upgrade head`, health check `/api/health`, restart on failure, one replica. They were meant to be versioned in `backend/railway.toml`, but Railway has deprecated that file in favour of `.railway/railway.ts`; moving them there is left for later.

- Why one worker and one replica: the rate limiter is per process. This is recorded in `railway.toml` and the README so it is not raised by accident.
- Why migrations in the pre-deploy step and not at app start: a failed migration stops the release and leaves the previous version serving.

### Database connection and exposure

- `DATABASE_URL` uses Supabase's **session pooler** (`...pooler.supabase.com:5432`) with the `postgresql+psycopg://` scheme and `sslmode=require`. The direct connection is IPv6-only, which the host may not route; the transaction pooler (port 6543) breaks prepared statements unless they are disabled. Session mode needs no code change.
- Pool size is set explicitly (`pool_size=5`, `max_overflow=5`, `pool_recycle=300`) to stay well under the pooler's client limit.
- Supabase exposes the `public` schema over its Data API to anyone holding the publishable key. The backend connects as the table owner, which bypasses row level security, so the migration enables RLS on all four tables with **no policies**. The API keeps working and the Data API returns nothing. This runs as a new Alembic revision guarded to PostgreSQL so SQLite tests are unaffected.
- Schema changes go through Alembic only. The Supabase MCP `apply_migration` tool is not used, to keep one migration history.

### Abuse protection

- Client IP comes from `X-Forwarded-For` as set by the platform proxy (uvicorn `--proxy-headers`). Because requests arrive through Vercel then Railway, the first address in the chain is used and the task verifies it is the visitor's, not Vercel's.
- New per-IP limits, in-memory like the existing one: guest creation (default 10 per hour) and chat (default 60 per hour). Both are settings.
- The existing per-guest chat limit and message length cap stay.
- A monthly spend cap is set on the MiniMax key itself. This is the only limit that holds if the others are bypassed.
- Why not Redis or a gateway product: one instance, small traffic. Revisit when a second instance is needed.

### Configuration and secrets

| Variable | Where | Note |
| --- | --- | --- |
| `DATABASE_URL` | Railway | Supabase session pooler string |
| `LLM_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL` | Railway | key is a secret |
| `CORS_ORIGINS` | Railway | Vercel production URL |
| rate limit settings | Railway | optional, defaults in code |

The frontend needs no environment variables. Secrets live only in Railway; `backend/.env.example` documents names with empty values; `.env*` is git-ignored except the example.

### Delivery

- GitHub Actions `ci.yml` runs on pull requests and on `main`: backend `uv sync --frozen` and `pytest`; frontend `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm build`. Both jobs always run, so they can be required checks.
- Deployment is done by the platforms' GitHub integrations, not by Actions: Vercel builds `frontend/` on every push and pull request; Railway builds `backend/` on `main` with "wait for CI" enabled. No deploy tokens are stored in GitHub.
- `main` is protected: pull request required, CI must pass, no force pushes.

### Repository

Public under `Yero123`, MIT license, `README.md` with what it is, architecture, local setup, configuration, deployment and contribution notes; `SECURITY.md` for private vulnerability reports; Dependabot for `uv`, `npm` and GitHub Actions; secret scanning and push protection enabled. Commits are authored with the personal identity, not the work one.

## Risks / Trade-offs

- [The work email is published in commit history] → Set the repo-local git identity before the first new commit; the existing initial commit is rewritten or accepted before the first push, since it cannot be changed quietly afterwards.
- [Streaming is buffered or cut by the Vercel rewrite] → Verified in the first deployment task; fallback is a direct call to Railway with CORS.
- [In-memory limits reset on every deploy and do not span instances] → Accepted at one instance; the provider spend cap is the backstop.
- [`X-Forwarded-For` can be spoofed if the backend URL is called directly] → The per-guest limit and spend cap still apply; the Railway URL is not advertised.
- [Supabase pauses free projects after a week without activity] → The health check queries the database, and Railway probes it, which keeps the project active while the backend runs.
- [A migration that is not backward compatible breaks the running version during pre-deploy] → Accepted for a single-developer app; brief downtime is tolerable.
- [`.mcp.json` publishes the Supabase project ref] → It is an identifier, not a credential; RLS closes the Data API.
- [Guest data is lost when the browser storage is cleared] → Unchanged from the MVP; now affects real users, so the README says so.

## Migration Plan

1. Repository: fix the git identity, add the standard files, create `Yero123/yapi`, push, enable protections.
2. Backend code: health check, pool settings, RLS revision, per-IP limits, Dockerfile, `railway.toml`.
3. Railway: create the project and service from the repo, set variables, deploy, confirm migrations ran and `/api/health` is ok.
4. Vercel: create the project with root `frontend/`, add `vercel.json` with the Railway URL, deploy.
5. Verify end to end on the public URL, then record the URLs in the README.

Rollback: Vercel and Railway both redeploy a previous build in one action. The only schema change is enabling RLS, reverted by the revision's downgrade.

## Open Questions

- Does the Vercel external rewrite stream SSE unbuffered, and what is its timeout? Answered by the first deployment task.
- MiniMax base URL and model are still unconfirmed (task 5.1 of `add-finance-app-mvp`); chat cannot be verified in production until that is done.
- Which address in `X-Forwarded-For` is the visitor's behind Vercel and Railway.
