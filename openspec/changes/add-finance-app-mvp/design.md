## Context

The repository is empty apart from `PRODUCT.md` and this change. The UI was agreed on a clickable mockup (https://claude.ai/artifact/CDsR3vB2AqLWprbohX3vpf): a soft-UI look with a vivid green accent and pastel category colors, light and dark themes. The owner chose the stack: React with shadcn/ui, FastAPI, PostgreSQL, LangChain with LangGraph, and OpenAI for the LLM (originally MiniMax). The audience is the general public, mostly on phones for capture and on desktop for review.

## Goals / Non-Goals

**Goals:**

- A working app with no login: open it, record a movement, see the month.
- The assistant can do what the forms do for transactions, categories and budgets, and can answer questions from the guest's own data.
- A backend service layer that a future WhatsApp or Telegram bot can call without going through the web UI.
- A guest identity that a later Google sign-in can claim without migrating data.

**Non-Goals:**

- Google sign-in, WhatsApp and Telegram.
- i18n and multi-currency. UI is English, amounts are USD.
- Recurring transactions, bank imports, shared budgets, exports.
- Production deployment. This change targets local development with docker-compose.

## Decisions

### Repository layout

```
frontend/   React + Vite + TypeScript
backend/    FastAPI app, Alembic migrations, pytest
docker-compose.yml   PostgreSQL
```

Two independent projects in one repo; no shared tooling or monorepo manager. Simpler than a workspace setup for two languages.

### Guest identity

On first load the frontend calls `POST /api/guests`, stores the returned UUID in `localStorage`, and sends it as `X-Guest-Id` on every request. The backend resolves it in a FastAPI dependency and returns 401 for a missing or unknown id; the frontend then creates a new guest. Creating a guest seeds default categories.

- Why not browser-only storage: the assistant's tools run on the server and need the data there; a later sign-in would also require a migration.
- Why not a signed cookie: a header works the same for a future bot or mobile client. The UUID is a bearer secret, which is acceptable for anonymous demo data. Sign-in later attaches a user to the guest row.

### Data model

- `guests`: `id` (UUID), `created_at`.
- `categories`: `id`, `guest_id`, `name`, `kind` (`expense` | `income`), `icon` (key from a fixed icon set), `color` (key from a fixed 8-color palette), `monthly_limit_cents` (nullable, expense only), `created_at`. Unique on (`guest_id`, lower(`name`)).
- `transactions`: `id`, `guest_id`, `category_id`, `kind`, `amount_cents` (positive integer), `description`, `occurred_on` (date), `created_at`.
- `chat_messages`: `id`, `guest_id`, `role`, `content`, `tool_results` (JSON, nullable), `created_at`.

Amounts are integer cents to avoid float rounding. A budget is not a table: it is a category whose `monthly_limit_cents` is set, evaluated per calendar month. Icon and color are stored as keys, not SVG paths or hex values, so the palette can change without a data migration. Deleting a category that has transactions is refused with 409; the UI explains why.

### Backend structure

`app/api` (routers) → `app/services` (business logic) → `app/models` (SQLAlchemy 2). Routers and chat tools both call the services, so there is one implementation of each rule. Synchronous SQLAlchemy with `psycopg`; request volume does not justify async sessions, and sync keeps LangChain tool code simple.

REST endpoints under `/api`: `guests`, `categories`, `transactions`, `dashboard/summary?month=YYYY-MM`, `chat`.

### Dashboard summary

One endpoint returns everything the dashboard shows for a month: budgets with spent and limit, income and expense totals for the 12 months ending at the selected month, spending by category with share, and the latest transactions. One request keeps the screen consistent and makes cache invalidation after a write a single query key.

### Chat assistant

A LangGraph prebuilt ReAct agent with tools: `create_transaction`, `create_category`, `set_category_limit`, `list_categories`, `get_spending_summary`, `list_transactions`. Tools are built per request as closures over the guest id and a DB session, so the model never supplies or chooses a guest.

LLM: `ChatOpenAI` from `langchain-openai` against OpenAI (`gpt-4.1-mini`), with base URL, model and key from environment variables, so any OpenAI-compatible provider is a configuration change. MiniMax was the first choice and its endpoint (`https://api.minimax.io/v1`) accepted the key, but the account had no balance, so the default moved to OpenAI.

`POST /api/chat` streams Server-Sent Events: `token` events for text, a `tool_result` event when a tool creates or changes a record, and `done`. The frontend renders tool results as cards and invalidates its dashboard, transactions and categories queries when one arrives. History is stored in `chat_messages` and the last 20 messages are sent to the model.

- Why not WebSockets: one-directional streaming over a POST is enough and simpler to operate.
- Why not a custom graph: the prebuilt agent covers a single tool loop; a custom graph is only needed if confirmation steps are added later.

### Frontend

React Router for the three screens, TanStack Query for server state, shadcn/ui components restyled through Tailwind theme tokens, Recharts for the monthly bar chart, lucide-react for icons. Theme tokens (ground, surface, raised and inset shadows, accent `#4ff08f` with dark green ink, the pastel category palette) live as CSS variables with a `dark` class variant, taken from the mockup. Theme choice is stored in `localStorage` and defaults to the OS setting.

The assistant panel is a docked right column at wide widths and a full-screen sheet below 1100px.

## Risks / Trade-offs

- [The chosen model handles tool calling poorly or is retired] → Provider settings are environment variables, so changing model or provider needs no code change; the first chat task verifies tool calling with a real call.
- [The guest id in `localStorage` is lost when the browser is cleared, and the data with it] → Accepted for the no-login version; Google sign-in is the planned fix.
- [Anyone holding a guest UUID can read that guest's data] → UUIDv4 is unguessable; the id is never placed in a URL.
- [The model creates a wrong record] → Tools validate inputs through the same services as the forms; every tool result is shown as a card so the user sees what was created and can edit or delete it.
- [Soft-UI shadows and pastel colors give low contrast] → Text keeps dark ink on light surfaces; the pastel chart and category colors must be checked for contrast during implementation and darkened where they fail.
- [Unbounded LLM cost on a public no-login app] → Per-guest rate limit on `/api/chat` and a cap on message length.

## Open Questions

- Which OpenAI model to settle on once real conversations have been tried; `gpt-4.1-mini` is the starting default.
- Whether deleting a category should offer to move its transactions to another category; this version refuses the delete.
