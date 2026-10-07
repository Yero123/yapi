import uuid
from typing import Annotated

from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Guest

Db = Annotated[Session, Depends(get_db)]


def get_guest(db: Db, x_guest_id: Annotated[str | None, Header()] = None) -> Guest:
    try:
        guest_id = uuid.UUID(x_guest_id or "")
    except ValueError:
        raise HTTPException(status_code=401, detail="Unknown guest")
    guest = db.get(Guest, guest_id)
    if guest is None:
        raise HTTPException(status_code=401, detail="Unknown guest")
    return guest


CurrentGuest = Annotated[Guest, Depends(get_guest)]
