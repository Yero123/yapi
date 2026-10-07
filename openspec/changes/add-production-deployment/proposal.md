## Why

Yapi only runs on a developer machine: `add-finance-app-mvp` lists production deployment as a non-goal. The owner wants the app reachable on a public URL and the code in a public GitHub repository, which needs hosting, a production database, a delivery pipeline and protection for an LLM key that anyone on the internet can now spend.

## What Changes

- Publish the repository as `Yero123/yapi` (public) with a license, contributor-facing documentation, a security policy and dependency updates.
- Add continuous integration on GitHub Actions: backend tests, frontend lint and build on every pull request and on `main`.
- Host the frontend on Vercel, built from `frontend/`, with `/api/*` proxied to the backend so the browser keeps calling a same-origin `/api`.
- Host the FastAPI backend on Railway as a container built from a new `backend/Dockerfile`, with migrations applied before each release and a health check that covers the database.
- Use the existing Supabase project as the production PostgreSQL database, with the tables closed to Supabase's public Data API.
- Add abuse limits needed once the app is public: a per-IP limit on guest creation and on chat, on top of the existing per-guest chat limit.
- Deploy `main` automatically; every pull request gets a frontend preview.

Out of scope: custom domain, staging environment, autoscaling beyond one backend instance, error tracking and analytics, sign-in.

## Capabilities

### New Capabilities

- `deployment`: where each part of Yapi runs in production, how a change reaches it, how configuration and secrets are supplied, and how health is checked.
- `abuse-protection`: limits that keep an anonymous public visitor from exhausting the LLM budget or flooding the database.
- `repository-standards`: what the public repository guarantees: no secrets in history, CI gating `main`, license and security policy.

### Modified Capabilities

None. `add-finance-app-mvp` is not archived, so `openspec/specs/` is empty; the new limits are added as their own capability rather than as a delta to `chat-assistant`.

## Impact

- New files: `backend/Dockerfile`, `backend/.dockerignore`, `backend/railway.toml`, `frontend/vercel.json`, `.github/workflows/ci.yml`, `.github/dependabot.yml`, `LICENSE`, `SECURITY.md`, `CONTRIBUTING.md`, `backend/.env.example`.
- Backend code: proxy-aware client IP, per-IP rate limits, a database check in the health endpoint, connection-pool settings for the Supabase pooler.
- Frontend code: none expected; it already calls a relative `/api`.
- External services: GitHub (`Yero123`), Vercel (team `yero123s-projects`), Railway (`yero123`), Supabase (project `dqyeeijsqcwhlulgewzf`), MiniMax.
- Cost: Railway bills for the always-on backend; Vercel and Supabase fit their free tiers at this size. MiniMax usage is the variable cost.
- Depends on `add-finance-app-mvp` reaching a frontend that builds; at the time of writing `pnpm build` fails.
