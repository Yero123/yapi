from fastapi import APIRouter

from app.config import get_settings
from app.deps import Db
from app.schemas import GuestOut
from app.services import guests as guest_service

router = APIRouter(prefix="/guests", tags=["guests"])


@router.post("", response_model=GuestOut, status_code=201)
def create_guest(db: Db):
    return guest_service.create_guest(db, sample_data=get_settings().seed_sample_data)
