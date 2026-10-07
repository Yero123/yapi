"""JSON cards describing a record the assistant created or changed; the chat UI renders them."""

from app.models import Category, Transaction


def category_card(category: Category) -> dict:
    return {"id": str(category.id), "name": category.name, "kind": category.kind, "icon": category.icon, "color": category.color, "monthly_limit_cents": category.monthly_limit_cents}


def transaction_card(transaction: Transaction) -> dict:
    return {
        "id": str(transaction.id),
        "kind": transaction.kind,
        "amount_cents": transaction.amount_cents,
        "description": transaction.description,
        "occurred_on": transaction.occurred_on.isoformat(),
        "category": category_card(transaction.category),
    }
