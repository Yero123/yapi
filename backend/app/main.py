from fastapi import APIRouter, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.api import categories, chat, dashboard, guests, transactions
from app.config import get_settings
from app.deps import Db
from app.errors import DomainError

app = FastAPI(title="Yapi API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in get_settings().cors_origins.split(",") if origin.strip()],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(DomainError)
def domain_error_handler(request: Request, error: DomainError) -> JSONResponse:
    return JSONResponse(status_code=error.status_code, content={"detail": error.message})


api = APIRouter(prefix="/api")


@api.get("/health")
def health(db: Db):
    try:
        db.execute(text("select 1"))
    except Exception:
        return JSONResponse(status_code=503, content={"status": "database unreachable"})
    return {"status": "ok"}


for module in (guests, categories, transactions, dashboard, chat):
    api.include_router(module.router)

app.include_router(api)
