## 1. Repository

- [ ] 1.1 Set the repo-local git identity to the personal account and decide whether to rewrite the initial commit's author before the first push
- [x] 1.2 Add `LICENSE` (MIT), `SECURITY.md`, `CONTRIBUTING.md`, the pull request template and `backend/.env.example`; extend `.gitignore`
- [x] 1.3 Rewrite `README.md`: purpose, architecture, local setup, configuration, tests, deployment, project status
- [x] 1.4 Add `.github/workflows/ci.yml` (backend tests; frontend lint and build) and `.github/dependabot.yml`
- [ ] 1.5 Switch `gh` to `Yero123`, create the public repo `Yero123/yapi`, add the remote and push `main`
- [ ] 1.6 Enable secret scanning with push protection, Dependabot alerts and private vulnerability reporting; protect `main` (pull request, CI required, no force push)

## 2. Backend readiness

- [ ] 2.1 Make `GET /api/health` run a trivial query and return a server error when the database is unreachable; test both cases
- [ ] 2.2 Set explicit pool settings on the engine and confirm the Supabase session pooler string works with `psycopg`
- [ ] 2.3 Add an Alembic revision that enables row level security on the four tables, PostgreSQL only
- [ ] 2.4 Resolve the client address from forwarded headers and add per-IP limits on guest creation and chat, with settings and tests
- [ ] 2.5 Add `backend/Dockerfile` and `backend/.dockerignore` (uv, locked install, non-root, single worker, proxy headers) and run the image locally against docker-compose PostgreSQL
- [ ] 2.6 Add `backend/railway.toml` with the pre-deploy migration, health check path, restart policy and one replica

## 3. Database

- [ ] 3.1 Take the session pooler connection string from the Supabase project and store it as `DATABASE_URL` in Railway only
- [ ] 3.2 After the first deploy, confirm the four tables exist with RLS enabled and that Supabase's security advisors report nothing for them

## 4. Backend on Railway

- [ ] 4.1 Create the Railway project and a service from `Yero123/yapi` with root directory `backend/`, "wait for CI" on, and a generated public domain
- [ ] 4.2 Set `DATABASE_URL`, `LLM_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL` and `CORS_ORIGINS`
- [ ] 4.3 Deploy and confirm in the logs that migrations ran and `/api/health` answers on the public domain

## 5. Frontend on Vercel

- [ ] 5.1 Add `frontend/vercel.json`: rewrite `/api/:path*` to the Railway domain, fall back to `index.html` for client routes
- [ ] 5.2 Create the Vercel project from the repo with root directory `frontend/`, framework Vite, production branch `main`
- [ ] 5.3 Deploy and confirm a deep link reloads correctly and `/api/health` answers through the Vercel origin
- [ ] 5.4 Send a chat message on the public URL and confirm it streams through the rewrite; if it is buffered or cut, switch the chat call to the Railway origin with CORS

## 6. Verification

- [ ] 6.1 Set a monthly spend cap on the MiniMax key
- [ ] 6.2 On the public URL: first visit as a guest, add a transaction, set a budget, create an expense by chat and see it on the dashboard, on a phone and on desktop
- [ ] 6.3 Confirm the per-IP limits trigger from one address and that two networks are counted separately
- [ ] 6.4 Open a test pull request: CI runs, a Vercel preview is published, and merging deploys both services
- [ ] 6.5 Add the public URL and the deployment notes to the README
