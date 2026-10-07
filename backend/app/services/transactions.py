import uuid
from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.errors import DomainError, NotFound
from app.models import Transaction
from app.services import categories as category_service
from app.services.months import add_months


def _check(db: Session, guest_id: uuid.UUID, kind: str, amount_cents: int, category_id: uuid.UUID) -> None:
    if kind not in ("expense", "income"):
        raise DomainError("A transaction is either an expense or an income.")
    if amount_cents <= 0:
        raise DomainError("The amount must be greater than zero.")
    category = category_service.get_category(db, guest_id, category_id)
    if category.kind != kind:
        raise DomainError(f'"{category.name}" is an {category.kind} category, so it cannot hold an {kind}.')


def get_transaction(db: Session, guest_id: uuid.UUID, transaction_id: uuid.UUID) -> Transaction:
    transaction = db.scalar(select(Transaction).where(Transaction.id == transaction_id, Transaction.guest_id == guest_id))
    if transaction is None:
        raise NotFound("That transaction does not exist.")
    return transaction


def list_transactions(db: Session, guest_id: uuid.UUID, *, kind: str | None = None, category_id: uuid.UUID | None = None, month_start: date | None = None, limit: int = 200) -> list[Transaction]:
    query = select(Transaction).where(Transaction.guest_id == guest_id)
    if kind:
        query = query.where(Transaction.kind == kind)
    if category_id:
        query = query.where(Transaction.category_id == category_id)
    if month_start:
        query = query.where(Transaction.occurred_on >= month_start, Transaction.occurred_on < add_months(month_start, 1))
    query = query.order_by(Transaction.occurred_on.desc(), Transaction.created_at.desc()).limit(limit)
    return list(db.scalars(query))


def create_transaction(db: Session, guest_id: uuid.UUID, *, kind: str, amount_cents: int, category_id: uuid.UUID, occurred_on: date, description: str = "") -> Transaction:
    _check(db, guest_id, kind, amount_cents, category_id)
    transaction = Transaction(guest_id=guest_id, kind=kind, amount_cents=amount_cents, category_id=category_id, occurred_on=occurred_on, description=description.strip())
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction


def update_transaction(db: Session, guest_id: uuid.UUID, transaction_id: uuid.UUID, changes: dict) -> Transaction:
    transaction = get_transaction(db, guest_id, transaction_id)
    kind = changes.get("kind", transaction.kind)
    amount_cents = changes.get("amount_cents", transaction.amount_cents)
    category_id = changes.get("category_id", transaction.category_id)
    _check(db, guest_id, kind, amount_cents, category_id)
    transaction.kind = kind
    transaction.amount_cents = amount_cents
    transaction.category_id = category_id
    if "occurred_on" in changes:
        transaction.occurred_on = changes["occurred_on"]
    if "description" in changes:
        transaction.description = (changes["description"] or "").strip()
    db.commit()
    db.refresh(transaction)
    return transaction


def delete_transaction(db: Session, guest_id: uuid.UUID, transaction_id: uuid.UUID) -> None:
    db.delete(get_transaction(db, guest_id, transaction_id))
    db.commit()
