import uuid
from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.catalog import COLORS, ICONS
from app.errors import Conflict, DomainError, NotFound
from app.models import Category, Transaction
from app.services.months import add_months

_UNSET = object()


def list_categories(db: Session, guest_id: uuid.UUID) -> list[Category]:
    return list(db.scalars(select(Category).where(Category.guest_id == guest_id).order_by(Category.kind, Category.created_at, Category.name)))


def get_category(db: Session, guest_id: uuid.UUID, category_id: uuid.UUID) -> Category:
    category = db.scalar(select(Category).where(Category.id == category_id, Category.guest_id == guest_id))
    if category is None:
        raise NotFound("That category does not exist.")
    return category


def find_by_name(db: Session, guest_id: uuid.UUID, name: str) -> Category | None:
    return db.scalar(select(Category).where(Category.guest_id == guest_id, func.lower(Category.name) == name.strip().lower()))


def month_totals(db: Session, guest_id: uuid.UUID, month_start: date) -> dict[uuid.UUID, int]:
    rows = db.execute(
        select(Transaction.category_id, func.sum(Transaction.amount_cents))
        .where(Transaction.guest_id == guest_id, Transaction.occurred_on >= month_start, Transaction.occurred_on < add_months(month_start, 1))
        .group_by(Transaction.category_id)
    )
    return {category_id: int(total) for category_id, total in rows}


def _check_look(icon: str | None, color: str | None) -> None:
    if icon is not None and icon not in ICONS:
        raise DomainError("That icon is not available.")
    if color is not None and color not in COLORS:
        raise DomainError("That color is not available.")


def _check_limit(kind: str, limit_cents: int | None) -> None:
    if limit_cents is None:
        return
    if kind != "expense":
        raise DomainError("Only expense categories can have a monthly limit.")
    if limit_cents <= 0:
        raise DomainError("The monthly limit must be greater than zero.")


def create_category(db: Session, guest_id: uuid.UUID, *, name: str, kind: str, icon: str, color: str, monthly_limit_cents: int | None = None) -> Category:
    name = name.strip()
    if not name:
        raise DomainError("Give the category a name.")
    if kind not in ("expense", "income"):
        raise DomainError("A category is either an expense or an income.")
    _check_look(icon, color)
    _check_limit(kind, monthly_limit_cents)
    if find_by_name(db, guest_id, name):
        raise Conflict(f'You already have a category called "{name}".')
    category = Category(guest_id=guest_id, name=name, kind=kind, icon=icon, color=color, monthly_limit_cents=monthly_limit_cents)
    db.add(category)
    db.commit()
    return category


def update_category(db: Session, guest_id: uuid.UUID, category_id: uuid.UUID, *, name: str | None = None, icon: str | None = None, color: str | None = None, monthly_limit_cents: object = _UNSET) -> Category:
    """`monthly_limit_cents=None` clears the limit; leaving it out keeps the current one."""
    category = get_category(db, guest_id, category_id)
    _check_look(icon, color)
    if name is not None:
        name = name.strip()
        if not name:
            raise DomainError("Give the category a name.")
        other = find_by_name(db, guest_id, name)
        if other is not None and other.id != category.id:
            raise Conflict(f'You already have a category called "{name}".')
        category.name = name
    if icon is not None:
        category.icon = icon
    if color is not None:
        category.color = color
    if monthly_limit_cents is not _UNSET:
        _check_limit(category.kind, monthly_limit_cents)  # type: ignore[arg-type]
        category.monthly_limit_cents = monthly_limit_cents  # type: ignore[assignment]
    db.commit()
    return category


def delete_category(db: Session, guest_id: uuid.UUID, category_id: uuid.UUID) -> None:
    category = get_category(db, guest_id, category_id)
    in_use = db.scalar(select(func.count()).select_from(Transaction).where(Transaction.category_id == category.id))
    if in_use:
        raise Conflict(f'"{category.name}" still has transactions. Delete or move them first.')
    db.delete(category)
    db.commit()
