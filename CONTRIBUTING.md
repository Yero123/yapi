# Contributing

Thanks for taking a look. This is a small project; the process is light.

## Setup

Follow "Run locally" in the [README](README.md).

## Workflow

1. Branch from `main`.
2. For anything that changes behaviour, start from the specs in [`openspec/`](openspec): a change has a proposal, a design, specs and tasks. Small fixes do not need one.
3. Keep the pull request focused on one thing and describe how you tested it.
4. CI must pass before merging.

## Conventions

- **Commits:** `<type>: short imperative sentence`, lowercase, subject line only. Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `ci`.
- **Backend:** business rules live in `app/services`; routers and assistant tools only call services. Add or update a test for every rule you change.
- **Database:** schema changes go through an Alembic revision, never by hand.
- **Frontend:** server state through TanStack Query; colors and shadows come from the theme tokens in `src/index.css`, not hard-coded values.
- **Money:** integer cents everywhere. No floats.
- **Secrets:** never commit a `.env` file or a key. Add new variables to `backend/.env.example` and the README table.

## Checks

```bash
cd backend && uv run pytest
cd frontend && pnpm lint && pnpm build
```
