import uuid

from fastapi import APIRouter, Response

from app.deps import CurrentGuest, Db
from app.schemas import Kind, TransactionIn, TransactionOut, TransactionUpdate
from app.services import transactions as transaction_service
from app.services.months import parse_month

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.get("", response_model=list[TransactionOut])
def list_transactions(db: Db, guest: CurrentGuest, kind: Kind | None = None, category_id: uuid.UUID | None = None, month: str | None = None):
    return transaction_service.list_transactions(db, guest.id, kind=kind, category_id=category_id, month_start=parse_month(month))


@router.post("", response_model=TransactionOut, status_code=201)
def create_transaction(body: TransactionIn, db: Db, guest: CurrentGuest):
    return transaction_service.create_transaction(db, guest.id, **body.model_dump())


@router.patch("/{transaction_id}", response_model=TransactionOut)
def update_transaction(transaction_id: uuid.UUID, body: TransactionUpdate, db: Db, guest: CurrentGuest):
    return transaction_service.update_transaction(db, guest.id, transaction_id, body.model_dump(exclude_unset=True))


@router.delete("/{transaction_id}", status_code=204)
def delete_transaction(transaction_id: uuid.UUID, db: Db, guest: CurrentGuest):
    transaction_service.delete_transaction(db, guest.id, transaction_id)
    return Response(status_code=204)
