"""Sample data for a new guest, so the first visit shows a lived-in month instead of
empty screens: budgets, a year of typical movements and one assistant exchange."""

import uuid
from datetime import date, datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models import Category, ChatMessage, Transaction
from app.services.cards import transaction_card
from app.services.months import add_months

MONTHS = 12

# category name -> monthly limit in cents
BUDGETS = {"Housing": 125000, "Food & Dining": 60000, "Transport": 20000, "Entertainment": 15000}

# day of month, category, cents, description, months it happens in (every Nth month)
MONTH_TEMPLATE = (
    (1, "Salary", 380000, "Salary", 1),
    (1, "Housing", 120000, "Rent", 1),
    (3, "Food & Dining", 8420, "Groceries", 1),
    (5, "Transport", 4850, "Gas", 1),
    (8, "Food & Dining", 3275, "Lunch with the team", 1),
    (10, "Entertainment", 1599, "Streaming subscription", 1),
    (12, "Health", 2340, "Pharmacy", 2),
    (14, "Food & Dining", 9130, "Groceries", 1),
    (16, "Shopping", 12000, "Sneakers", 3),
    (18, "Transport", 3600, "Bus pass", 1),
    (20, "Freelance", 65000, "Logo project", 3),
    (22, "Food & Dining", 6175, "Dinner with friends", 1),
    (24, "Entertainment", 9600, "Concert tickets", 2),
    (26, "Food & Dining", 7810, "Groceries", 1),
    (27, "Transport", 4200, "Gas", 1),
)

FIXED = {"Salary", "Rent", "Streaming subscription", "Bus pass"}


def _amount(cents: int, description: str, month_index: int) -> int:
    """Everyday spending drifts a little from month to month; fixed bills do not."""
    if description in FIXED:
        return cents
    return round(cents * (0.85 + 0.06 * (month_index % 5)))


def seed_sample_data(db: Session, guest_id: uuid.UUID, categories: dict[str, Category], today: date | None = None) -> None:
    today = today or date.today()
    this_month = today.replace(day=1)

    for name, limit in BUDGETS.items():
        categories[name].monthly_limit_cents = limit

    for index in range(MONTHS):
        month_start = add_months(this_month, index - (MONTHS - 1))
        for day, name, cents, description, every in MONTH_TEMPLATE:
            occurred_on = month_start.replace(day=day)
            if index % every or occurred_on > today:
                continue
            category = categories[name]
            db.add(Transaction(guest_id=guest_id, category_id=category.id, kind=category.kind, amount_cents=_amount(cents, description, index), description=description, occurred_on=occurred_on))

    food = categories["Food & Dining"]
    lunch = Transaction(guest_id=guest_id, category_id=food.id, kind="expense", amount_cents=1200, description="Lunch", occurred_on=today)
    db.add(lunch)
    db.flush()
    db.refresh(lunch)

    now = datetime.now(timezone.utc)
    db.add(ChatMessage(guest_id=guest_id, role="user", content="Add a $12 lunch expense", created_at=now))
    db.add(
        ChatMessage(
            guest_id=guest_id,
            role="assistant",
            content="Done. I added a $12.00 lunch to Food & Dining for today.",
            tool_results=[{"type": "transaction_created", "transaction": transaction_card(lunch)}],
            created_at=now + timedelta(milliseconds=1),
        )
    )
