"""Assistant tools. Each set is bound to one guest and one DB session, so the
model can never name or choose whose data it touches."""

import threading
import uuid
from datetime import date

from langchain_core.tools import tool
from sqlalchemy.orm import Session

from app.catalog import COLORS
from app.errors import DomainError
from app.models import Category
from app.services import categories as category_service
from app.services.cards import category_card, transaction_card
from app.services import dashboard as dashboard_service
from app.services import transactions as transaction_service
from app.services.months import parse_month

DEFAULT_ICON = {"expense": "bag", "income": "briefcase"}


def money(cents: int) -> str:
    return f"${cents / 100:,.2f}"


def to_cents(amount: float) -> int:
    return round(amount * 100)


def build_tools(db: Session, guest_id: uuid.UUID, results: list[dict], today: date | None = None) -> list:
    """`results` collects a card for every record a tool creates or changes."""
    today = today or date.today()

    def find_category(name: str) -> Category:
        category = category_service.find_by_name(db, guest_id, name)
        if category is None:
            names = ", ".join(c.name for c in category_service.list_categories(db, guest_id))
            raise DomainError(f'There is no category called "{name}". Existing categories: {names}.')
        return category

    # The agent runs the tool calls of one model turn in parallel threads, and they share this session.
    lock = threading.Lock()

    def guarded(action):
        with lock:
            try:
                return action()
            except DomainError as error:
                db.rollback()
                return f"Could not do that: {error.message}"

    @tool
    def list_categories() -> str:
        """List the user's categories with their type and monthly limit (budget), if any."""
        def action():
            lines = []
            for c in category_service.list_categories(db, guest_id):
                limit = f", budget {money(c.monthly_limit_cents)} per month" if c.monthly_limit_cents else ""
                lines.append(f"- {c.name} ({c.kind}{limit})")
            return "\n".join(lines) or "The user has no categories."

        return guarded(action)

    @tool
    def create_transaction(kind: str, amount: float, category_name: str, description: str = "", on_date: str = "") -> str:
        """Record an expense or an income.

        Args:
            kind: "expense" or "income".
            amount: Amount in US dollars, greater than zero.
            category_name: Name of one of the user's existing categories of the same kind.
            description: Short description, e.g. "Lunch".
            on_date: Date as YYYY-MM-DD. Leave empty for today.
        """

        def action():
            category = find_category(category_name)
            try:
                occurred_on = date.fromisoformat(on_date) if on_date else today
            except ValueError:
                raise DomainError("The date must look like 2026-09-30.")
            transaction = transaction_service.create_transaction(db, guest_id, kind=kind, amount_cents=to_cents(amount), category_id=category.id, occurred_on=occurred_on, description=description)
            results.append({"type": "transaction_created", "transaction": transaction_card(transaction)})
            return f"Created {kind} of {money(transaction.amount_cents)} in {category.name} on {occurred_on.isoformat()}."

        return guarded(action)

    @tool
    def create_category(name: str, kind: str, monthly_limit: float = 0) -> str:
        """Create a category.

        Args:
            name: Category name.
            kind: "expense" or "income".
            monthly_limit: Optional monthly budget in US dollars for an expense category. 0 means no budget.
        """

        def action():
            used = {c.color for c in category_service.list_categories(db, guest_id)}
            color = next((c for c in COLORS if c not in used), COLORS[0])
            category = category_service.create_category(db, guest_id, name=name, kind=kind, icon=DEFAULT_ICON.get(kind, "bag"), color=color, monthly_limit_cents=to_cents(monthly_limit) or None)
            results.append({"type": "category_created", "category": category_card(category)})
            return f'Created {kind} category "{category.name}".'

        return guarded(action)

    @tool
    def set_category_limit(category_name: str, monthly_limit: float) -> str:
        """Set, change or remove the monthly budget of an expense category.

        Args:
            category_name: Name of an existing expense category.
            monthly_limit: Monthly budget in US dollars. 0 removes the budget.
        """

        def action():
            category = find_category(category_name)
            category = category_service.update_category(db, guest_id, category.id, monthly_limit_cents=to_cents(monthly_limit) or None)
            results.append({"type": "budget_updated", "category": category_card(category)})
            if category.monthly_limit_cents:
                return f"{category.name} now has a budget of {money(category.monthly_limit_cents)} per month."
            return f"{category.name} no longer has a budget."

        return guarded(action)

    @tool
    def get_spending_summary(month: str = "") -> str:
        """Income, expenses, spending per category and budget status for one month.

        Args:
            month: Month as YYYY-MM. Leave empty for the current month.
        """

        def action():
            data = dashboard_service.summary(db, guest_id, parse_month(month or None, today))
            if not data["income_cents"] and not data["expense_cents"]:
                return f"Nothing is recorded for {data['month']}."
            lines = [f"Month {data['month']}: income {money(data['income_cents'])}, expenses {money(data['expense_cents'])}."]
            limits = {b["category"].id: b["limit_cents"] for b in data["budgets"]}
            for row in data["breakdown"]:
                category, amount = row["category"], row["amount_cents"]
                limit = limits.get(category.id)
                if limit is None:
                    status = "no budget"
                elif amount > limit:
                    status = f"over its {money(limit)} budget by {money(amount - limit)}"
                else:
                    status = f"{money(limit - amount)} left of its {money(limit)} budget"
                lines.append(f"- {category.name}: {money(amount)} ({status})")
            for budget in data["budgets"]:
                if not budget["spent_cents"]:
                    lines.append(f"- {budget['category'].name}: $0.00 ({money(budget['limit_cents'])} left of its {money(budget['limit_cents'])} budget)")
            return "\n".join(lines)

        return guarded(action)

    @tool
    def list_transactions(month: str = "", category_name: str = "", kind: str = "") -> str:
        """List up to 30 transactions of one month, newest first.

        Args:
            month: Month as YYYY-MM. Leave empty for the current month.
            category_name: Only this category. Leave empty for all.
            kind: "expense" or "income". Leave empty for both.
        """

        def action():
            category = find_category(category_name) if category_name else None
            rows = transaction_service.list_transactions(db, guest_id, kind=kind or None, category_id=category.id if category else None, month_start=parse_month(month or None, today), limit=30)
            if not rows:
                return "No transactions match."
            return "\n".join(f"- {t.occurred_on.isoformat()} {t.kind} {money(t.amount_cents)} {t.category.name}: {t.description or '(no description)'}" for t in rows)

        return guarded(action)

    return [list_categories, create_transaction, create_category, set_category_limit, get_spending_summary, list_transactions]
