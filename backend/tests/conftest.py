import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import ratelimit
from app.api import chat as chat_api
from app.config import get_settings
from app.db import Base, get_db, get_session_factory
from app.main import app


@pytest.fixture
def session_factory():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    yield sessionmaker(bind=engine, expire_on_commit=False)
    engine.dispose()


@pytest.fixture
def db(session_factory):
    with session_factory() as session:
        yield session


@pytest.fixture
def client(session_factory):
    def override_db():
        with session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_session_factory] = lambda: session_factory
    chat_api._recent.clear()
    ratelimit.reset()
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture(autouse=True)
def no_sample_data(monkeypatch):
    """Guests start empty in tests; test_sample_data.py turns the seeding back on."""
    monkeypatch.setattr(get_settings(), "seed_sample_data", False)


@pytest.fixture
def guest(client):
    """Headers identifying a freshly created guest."""
    return {"X-Guest-Id": client.post("/api/guests").json()["id"]}


def category_id(client, headers, name):
    return next(c["id"] for c in client.get("/api/categories", headers=headers).json() if c["name"] == name)
