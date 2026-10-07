## 1. Project setup

- [x] 1.1 Add `docker-compose.yml` with PostgreSQL and a root `.gitignore` and `README.md` with run instructions
- [x] 1.2 Scaffold `backend/` (FastAPI, SQLAlchemy 2, Alembic, Pydantic settings, pytest) with a health endpoint and `.env.example`
- [x] 1.3 Scaffold `frontend/` (Vite, React, TypeScript, Tailwind, shadcn/ui, React Router, TanStack Query) with a dev proxy to the backend

## 2. Backend data and guests

- [x] 2.1 Create models and the initial Alembic migration for guests, categories, transactions and chat_messages
- [x] 2.2 Implement guest creation with default category seeding and the `X-Guest-Id` dependency
- [x] 2.3 Test guest creation, seeding, unknown-id rejection and cross-guest isolation
- [x] 2.4 Seed sample budgets, a year of transactions and one assistant exchange for new guests, switchable with `SEED_SAMPLE_DATA`

## 3. Backend categories and transactions

- [x] 3.1 Implement the category service and router: list, create, update, delete, duplicate-name and in-use rules, limit only on expense categories
- [x] 3.2 Implement the transaction service and router: create, update, delete, list with type, category and month filters
- [x] 3.3 Test category and transaction rules, including validation errors

## 4. Backend dashboard

- [x] 4.1 Implement the dashboard summary service and endpoint: budgets, 12-month income and expense series, category breakdown, recent transactions
- [x] 4.2 Test the summary for a month with data, an empty month and an over-limit budget

## 5. Backend chat assistant

- [x] 5.1 Confirm the LLM provider (OpenAI, `gpt-4.1-mini`) and tool calling with a real call, and add the LLM settings
- [x] 5.2 Implement the guest-bound tools on top of the services
- [x] 5.3 Implement the LangGraph agent, the streaming `POST /api/chat` endpoint, history persistence and the history endpoint
- [x] 5.4 Add a per-guest rate limit and message length cap on chat
- [x] 5.5 Test the tools and the chat endpoint with a fake model

## 6. Frontend foundation

- [x] 6.1 Add theme tokens from the mockup (light and dark), the Manrope font and the restyled shadcn components
- [x] 6.2 Implement the API client, guest bootstrap and query setup
- [x] 6.3 Implement the app shell: sidebar, routing, guest block, theme switch, responsive layout

## 7. Frontend screens

- [x] 7.1 Build the dashboard: month selector, budget cards, monthly chart with tooltip, category breakdown, recent transactions, empty states
- [x] 7.2 Build the transactions screen: table, filters, add and edit dialog, delete confirmation
- [x] 7.3 Build the categories screen: table, create and edit dialog with icon and color pickers and monthly limit, delete
- [x] 7.4 Add loading and error states to every screen

## 8. Frontend assistant

- [x] 8.1 Build the assistant panel: history, streaming replies, result cards, suggested prompts, collapse and mobile sheet
- [x] 8.2 Refresh dashboard, transactions and categories data when the assistant changes a record

## 9. Verification

- [x] 9.1 Run backend tests and typecheck the edited frontend files
- [x] 9.2 Run the app end to end: first visit as a guest, add a transaction by form, set a budget, create an expense by chat and see it on the dashboard
- [ ] 9.3 Check light and dark themes and phone width, and fix contrast failures in the pastel colors
