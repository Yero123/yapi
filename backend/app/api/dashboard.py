from fastapi import APIRouter

from app.deps import CurrentGuest, Db
from app.schemas import DashboardSummary
from app.services import dashboard as dashboard_service
from app.services.months import parse_month

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def summary(db: Db, guest: CurrentGuest, month: str | None = None):
    return dashboard_service.summary(db, guest.id, parse_month(month))
