import uuid

from fastapi import APIRouter, Response

from app.deps import CurrentGuest, Db
from app.schemas import CategoryIn, CategoryOut, CategoryUpdate, CategoryWithSpent
from app.services import categories as category_service
from app.services.months import parse_month

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=list[CategoryWithSpent])
def list_categories(db: Db, guest: CurrentGuest, month: str | None = None):
    totals = category_service.month_totals(db, guest.id, parse_month(month))
    return [
        CategoryWithSpent(**CategoryOut.model_validate(c).model_dump(), month_total_cents=totals.get(c.id, 0))
        for c in category_service.list_categories(db, guest.id)
    ]


@router.post("", response_model=CategoryOut, status_code=201)
def create_category(body: CategoryIn, db: Db, guest: CurrentGuest):
    return category_service.create_category(db, guest.id, **body.model_dump())


@router.patch("/{category_id}", response_model=CategoryOut)
def update_category(category_id: uuid.UUID, body: CategoryUpdate, db: Db, guest: CurrentGuest):
    return category_service.update_category(db, guest.id, category_id, **body.model_dump(exclude_unset=True))


@router.delete("/{category_id}", status_code=204)
def delete_category(category_id: uuid.UUID, db: Db, guest: CurrentGuest):
    category_service.delete_category(db, guest.id, category_id)
    return Response(status_code=204)
