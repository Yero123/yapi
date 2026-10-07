from langchain_core.messages import AIMessage
from sqlalchemy.exc import OperationalError

from app.config import Settings, get_settings
from app.db import get_db
from app.main import app
from tests.test_chat import use_model


def test_health_checks_the_database(client):
    assert client.get("/api/health").json() == {"status": "ok"}

    class Broken:
        def execute(self, *args, **kwargs):
            raise OperationalError("select 1", {}, Exception("down"))

    app.dependency_overrides[get_db] = lambda: Broken()
    assert client.get("/api/health").status_code == 503


def test_guest_creation_is_limited_per_address(client):
    limit = get_settings().guest_rate_limit_per_hour_per_ip
    for _ in range(limit):
        assert client.post("/api/guests").status_code == 201
    assert client.post("/api/guests").status_code == 429


def test_chat_address_limit_spans_guests(client, monkeypatch):
    monkeypatch.setattr(get_settings(), "chat_rate_limit_per_hour_per_ip", 2)
    first = {"X-Guest-Id": client.post("/api/guests").json()["id"]}
    second = {"X-Guest-Id": client.post("/api/guests").json()["id"]}
    use_model(*[AIMessage(content="ok")] * 3)
    assert client.post("/api/chat", headers=first, json={"message": "Hi"}).status_code == 200
    assert client.post("/api/chat", headers=second, json={"message": "Hi"}).status_code == 200
    assert client.post("/api/chat", headers=first, json={"message": "Hi"}).status_code == 429


def test_plain_postgres_urls_get_the_driver():
    assert Settings(database_url="postgresql://u:p@h:5432/d").database_url == "postgresql+psycopg://u:p@h:5432/d"
    assert Settings(database_url="postgres://u:p@h/d").database_url == "postgresql+psycopg://u:p@h/d"
    assert Settings(database_url="sqlite://").database_url == "sqlite://"
