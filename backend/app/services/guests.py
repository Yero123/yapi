from datetime import date

from sqlalchemy.orm import Session

from app.catalog import DEFAULT_CATEGORIES
from app.models import Category, Guest
from app.services.sample_data import seed_sample_data


def create_guest(db: Session, sample_data: bool = False, today: date | None = None) -> Guest:
    guest = Guest()
    db.add(guest)
    db.flush()
    categories = {}
    for name, kind, icon, color, limit in DEFAULT_CATEGORIES:
        categories[name] = Category(guest_id=guest.id, name=name, kind=kind, icon=icon, color=color, monthly_limit_cents=limit)
        db.add(categories[name])
    db.flush()
    if sample_data:
        seed_sample_data(db, guest.id, categories, today)
    db.commit()
    return guest
