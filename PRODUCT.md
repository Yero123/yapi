# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React frontend with shadcn/ui components. FastAPI backend with PostgreSQL. Chat assistant built with LangChain, plus LangGraph where tool orchestration needs it, using a MiniMax API token as the LLM provider.

## Users

The general public from day one, including people who have never tracked their expenses. They record a movement right after it happens, mostly on a phone, and come back to a desktop dashboard to see where the month stands.

## Product Purpose

Yapi lets a person record expenses and incomes, group them in categories, cap a category with a monthly limit so it becomes a budget, and see the month at a glance. Success is someone recording their first movement and understanding their month without creating an account or reading instructions.

## Positioning

An easy chat assistant is the way in: the user types what they spent or asks about their money and the assistant creates the record or answers from their data. The same assistant is meant to be reachable from WhatsApp and Telegram, so tracking happens where the user already is.

## Operating Context

- Phone: short, frequent visits to add an expense or income, by form or by chat.
- Desktop: a full dashboard for reviewing the month — budgets, income vs expenses by month, spending by category, latest movements.
- First visit works with no login; the data belongs to an anonymous guest session.

## Capabilities and Constraints

- Transactions are expenses or incomes.
- A category has a name, an icon, a color and a type (expense or income). An optional monthly limit turns it into a budget, reset each calendar month.
- Views: dashboard, transactions, categories.
- Assistant tools: create a transaction, create or update a category or budget, answer questions about the user's data.
- English UI and US dollars only for now; other languages and currencies come later.
- Planned, not in the first version: Google sign-in (which will claim the guest's data), WhatsApp and Telegram integration.

## Brand Commitments

- Name: Yapi.
- Main color: a vivid green, given by the user as an image swatch (bright green with darker green rays). Exact hex not specified by the user.
- Modern and very simple, with dark mode available.

## Evidence on Hand

- A reference dashboard mockup supplied by the user (layout reference only, not Yapi's own design).
- No real user data, testimonials, pricing or usage numbers exist. Mockups use sample data and must not present it as real.

## Product Principles

1. No friction at the start: useful before any account exists.
2. Saying it is as good as typing it into a form: anything the forms can do, the assistant can do.
3. One simple model: a budget is a category with a limit, nothing more to learn.
4. Phone for capture, desktop for review; both are first-class.
5. Clear to someone who has never tracked money before.
