import uuid
from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Transaction
from app.services import categories as category_service
from app.services import transactions as transaction_service
from app.services.months import add_months, month_key

SERIES_MONTHS = 12
RECENT_COUNT = 6


def summary(db: Session, guest_id: uuid.UUID, month_start: date) -> dict:
    series_start = add_months(month_start, -(SERIES_MONTHS - 1))
    month_end = add_months(month_start, 1)

    months = [add_months(series_start, i) for i in range(SERIES_MONTHS)]
    totals = {month_key(m): {"income": 0, "expense": 0} for m in months}
    rows = db.execute(
        select(Transaction.occurred_on, Transaction.kind, func.sum(Transaction.amount_cents))
        .where(Transaction.guest_id == guest_id, Transaction.occurred_on >= series_start, Transaction.occurred_on < month_end)
        .group_by(Transaction.occurred_on, Transaction.kind)
    )
    for occurred_on, kind, total in rows:
        totals[month_key(occurred_on)][kind] += int(total)

    current = totals[month_key(month_start)]
    previous = totals[month_key(add_months(month_start, -1))]

    categories = category_service.list_categories(db, guest_id)
    spent = category_service.month_totals(db, guest_id, month_start)
    expense_categories = [c for c in categories if c.kind == "expense"]

    budgets = [
        {"category": c, "spent_cents": spent.get(c.id, 0), "limit_cents": c.monthly_limit_cents}
        for c in expense_categories
        if c.monthly_limit_cents
    ]
    breakdown = sorted(
        ({"category": c, "amount_cents": spent[c.id]} for c in expense_categories if spent.get(c.id)),
        key=lambda row: row["amount_cents"],
        reverse=True,
    )

    return {
        "month": month_key(month_start),
        "income_cents": current["income"],
        "expense_cents": current["expense"],
        "previous_income_cents": previous["income"],
        "previous_expense_cents": previous["expense"],
        "budgets": budgets,
        "series": [{"month": key, "income_cents": v["income"], "expense_cents": v["expense"]} for key, v in totals.items()],
        "breakdown": breakdown,
        "recent": transaction_service.list_transactions(db, guest_id, month_start=month_start, limit=RECENT_COUNT),
    }
