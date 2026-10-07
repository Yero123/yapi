## Why

Yapi does not exist yet beyond an approved UI mockup. People who have never tracked their money need a way to record expenses and incomes, cap categories with budgets and see their month, without an account and with an assistant they can simply talk to. This change builds that first working version.

## What Changes

- Add a React web app (Vite, TypeScript, Tailwind, shadcn/ui) implementing the approved mockup: dashboard, transactions and categories screens, sidebar navigation, a collapsible assistant panel, and light and dark themes in the soft-UI green style.
- Add a FastAPI backend with PostgreSQL that stores categories, transactions and chat history per guest.
- Add guest sessions: the first visit creates an anonymous guest and seeds default categories, so the app works with no login.
- Add categories with name, icon, color, type and an optional monthly limit; a category with a limit is a budget.
- Add expense and income transactions with create, edit, delete and filtered listing.
- Add a dashboard summary: budget progress, income vs expenses for the last 12 months, spending by category, and recent transactions.
- Add a chat assistant (LangChain + LangGraph, MiniMax as the LLM) that can create transactions, create or update categories and budgets, and answer questions about the guest's data.

Out of scope: Google sign-in, WhatsApp and Telegram integration, languages other than English, currencies other than USD.

## Capabilities

### New Capabilities

- `guest-session`: anonymous guest identity created on first visit, used to scope all data, with default categories seeded.
- `categories`: category management with icon, color, type and optional monthly limit that turns a category into a budget.
- `transactions`: recording, editing, deleting and listing expenses and incomes.
- `dashboard`: monthly summary of budgets, income vs expenses over time, spending by category and recent transactions.
- `chat-assistant`: conversational assistant with tools to create records and answer questions about the guest's data.
- `app-shell`: application layout, navigation, theming and responsive behaviour.

### Modified Capabilities

None.

## Impact

- New code: `frontend/` (React app), `backend/` (FastAPI app, Alembic migrations, tests), `docker-compose.yml` for PostgreSQL.
- New dependencies: React, Vite, Tailwind, shadcn/ui, TanStack Query, Recharts, lucide-react on the frontend; FastAPI, SQLAlchemy, Alembic, Pydantic, LangChain, LangGraph, langchain-openai on the backend.
- External service: MiniMax API, requiring a `MINIMAX_API_KEY`.
- No existing code or users are affected; the repository is empty.
