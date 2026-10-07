import uuid
from datetime import date

from app.config import get_settings
from app.models import ChatMessage, Transaction
from app.services import dashboard as dashboard_service
from app.services import guests as guest_service
from sqlalchemy import select

TODAY = date(2026, 10, 6)


def test_sample_guest_has_a_year_of_movements_and_budgets(db):
    guest = guest_service.create_guest(db, sample_data=True, today=TODAY)
    data = dashboard_service.summary(db, guest.id, date(2026, 10, 1))

    assert {b["category"].name for b in data["budgets"]} == {"Housing", "Food & Dining", "Transport", "Entertainment"}
    assert all(point["income_cents"] > 0 and point["expense_cents"] > 0 for point in data["series"])
    assert data["recent"][0].description == "Lunch"  # the expense from the sample chat, dated today

    dates = list(db.scalars(select(Transaction.occurred_on).where(Transaction.guest_id == guest.id)))
    assert max(dates) == TODAY  # nothing dated in the future
    assert min(dates) == date(2025, 11, 1)


def test_sample_chat_shows_an_expense_the_assistant_created(db):
    guest = guest_service.create_guest(db, sample_data=True, today=TODAY)
    user, assistant = db.scalars(select(ChatMessage).where(ChatMessage.guest_id == guest.id).order_by(ChatMessage.created_at))

    assert (user.role, assistant.role) == ("user", "assistant")
    card = assistant.tool_results[0]
    assert card["type"] == "transaction_created"
    lunch = db.get(Transaction, uuid.UUID(card["transaction"]["id"]))
    assert (lunch.amount_cents, lunch.occurred_on, lunch.category.name) == (1200, TODAY, "Food & Dining")


def test_new_guests_get_sample_data_by_default(client, monkeypatch):
    monkeypatch.setattr(get_settings(), "seed_sample_data", True)
    headers = {"X-Guest-Id": client.post("/api/guests").json()["id"]}
    assert client.get("/api/dashboard/summary", headers=headers).json()["budgets"]
    assert len(client.get("/api/chat/history", headers=headers).json()) == 2
