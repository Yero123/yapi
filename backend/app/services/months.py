from datetime import date

from app.errors import DomainError


def parse_month(value: str | None, today: date | None = None) -> date:
    """'YYYY-MM' -> first day of that month; None -> first day of the current month."""
    if value is None:
        return (today or date.today()).replace(day=1)
    try:
        year, month = value.split("-")
        return date(int(year), int(month), 1)
    except (ValueError, TypeError):
        raise DomainError("Month must look like 2026-09.")


def add_months(first: date, count: int) -> date:
    index = first.year * 12 + (first.month - 1) + count
    return date(index // 12, index % 12 + 1, 1)


def month_key(day: date) -> str:
    return f"{day.year:04d}-{day.month:02d}"
