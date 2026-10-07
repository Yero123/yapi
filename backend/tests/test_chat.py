import json
import uuid
from datetime import date

import pytest
from langchain_core.language_models.fake_chat_models import FakeMessagesListChatModel
from langchain_core.messages import AIMessage

from app.chat.agent import ThinkFilter, get_chat_model
from app.chat.tools import build_tools
from app.config import get_settings
from app.main import app
from app.services import categories as category_service
from app.services import guests as guest_service
from app.services import transactions as transaction_service
from tests.conftest import category_id

TODAY = date(2026, 9, 30)


class ScriptedModel(FakeMessagesListChatModel):
    """Replays a fixed list of replies; accepts tool binding like a real chat model."""

    def bind_tools(self, tools, **kwargs):
        return self


def call(name, **args):
    return AIMessage(content="", tool_calls=[{"name": name, "args": args, "id": str(uuid.uuid4())}])


def use_model(*replies):
    app.dependency_overrides[get_chat_model] = lambda: ScriptedModel(responses=list(replies))


def events(response):
    return [json.loads(line[6:]) for line in response.text.splitlines() if line.startswith("data: ")]


@pytest.fixture
def tools(db):
    guest = guest_service.create_guest(db)
    results = []
    by_name = {t.name: t for t in build_tools(db, guest.id, results, TODAY)}
    return db, guest.id, results, by_name


def test_create_transaction_tool_defaults_to_today(tools):
    db, guest_id, results, by_name = tools
    reply = by_name["create_transaction"].invoke({"kind": "expense", "amount": 12, "category_name": "food & dining", "description": "Lunch"})
    assert "Created expense of $12.00" in reply
    (saved,) = transaction_service.list_transactions(db, guest_id, month_start=date(2026, 9, 1))
    assert (saved.amount_cents, saved.occurred_on, saved.description) == (1200, TODAY, "Lunch")
    assert results[0]["type"] == "transaction_created" and results[0]["transaction"]["amount_cents"] == 1200


def test_tools_report_problems_instead_of_raising(tools):
    db, guest_id, results, by_name = tools
    assert 'no category called "Pets"' in by_name["set_category_limit"].invoke({"category_name": "Pets", "monthly_limit": 50})
    assert "greater than zero" in by_name["create_transaction"].invoke({"kind": "expense", "amount": 0, "category_name": "Health"})
    assert "cannot hold" in by_name["create_transaction"].invoke({"kind": "expense", "amount": 5, "category_name": "Salary"})
    assert results == []
    assert transaction_service.list_transactions(db, guest_id) == []


def test_budget_and_summary_tools(tools):
    db, guest_id, results, by_name = tools
    assert "$300.00 per month" in by_name["set_category_limit"].invoke({"category_name": "Shopping", "monthly_limit": 300})
    assert category_service.find_by_name(db, guest_id, "Shopping").monthly_limit_cents == 30000
    assert results[0]["type"] == "budget_updated"

    assert by_name["get_spending_summary"].invoke({}) == "Nothing is recorded for 2026-09."
    by_name["create_transaction"].invoke({"kind": "expense", "amount": 350, "category_name": "Shopping"})
    summary = by_name["get_spending_summary"].invoke({})
    assert "expenses $350.00" in summary and "over its $300.00 budget by $50.00" in summary

    assert "no longer has a budget" in by_name["set_category_limit"].invoke({"category_name": "Shopping", "monthly_limit": 0})


def test_create_category_tool(tools):
    db, guest_id, results, by_name = tools
    assert 'Created expense category "Pets"' in by_name["create_category"].invoke({"name": "Pets", "kind": "expense", "monthly_limit": 80})
    assert category_service.find_by_name(db, guest_id, "pets").monthly_limit_cents == 8000
    assert "already" in by_name["create_category"].invoke({"name": "pets", "kind": "expense"})


def test_chat_creates_a_record_and_saves_history(client, guest):
    use_model(call("create_transaction", kind="expense", amount=12, category_name="Food & Dining", description="Lunch"), AIMessage(content="Done. I added a $12.00 lunch."))

    stream = events(client.post("/api/chat", headers=guest, json={"message": "Add a $12 lunch expense"}))

    assert [e["type"] for e in stream if e["type"] != "token"] == ["tool_result", "done"]
    assert "".join(e["text"] for e in stream if e["type"] == "token") == "Done. I added a $12.00 lunch."
    card = next(e for e in stream if e["type"] == "tool_result")["result"]
    assert card["transaction"]["category"]["name"] == "Food & Dining"

    food = category_id(client, guest, "Food & Dining")
    assert next(c for c in client.get("/api/categories", headers=guest).json() if c["id"] == food)["month_total_cents"] == 1200

    history = client.get("/api/chat/history", headers=guest).json()
    assert [(m["role"], m["content"]) for m in history] == [("user", "Add a $12 lunch expense"), ("assistant", "Done. I added a $12.00 lunch.")]
    assert history[1]["tool_results"][0]["type"] == "transaction_created"


def test_chat_history_is_private_to_the_guest(client, guest):
    use_model(AIMessage(content="Hello."))
    client.post("/api/chat", headers=guest, json={"message": "Hi"})
    other = {"X-Guest-Id": client.post("/api/guests").json()["id"]}
    assert client.get("/api/chat/history", headers=other).json() == []


def test_chat_reports_an_unavailable_assistant(client, guest):
    use_model()  # no scripted replies: the model raises
    stream = events(client.post("/api/chat", headers=guest, json={"message": "Hi"}))
    assert stream[-1]["type"] == "error"
    assert [m["role"] for m in client.get("/api/chat/history", headers=guest).json()] == ["user"]


def test_chat_limits_length_and_rate(client, guest):
    settings = get_settings()
    too_long = "x" * (settings.chat_max_message_chars + 1)
    assert client.post("/api/chat", headers=guest, json={"message": too_long}).status_code == 400
    assert client.post("/api/chat", headers=guest, json={"message": "   "}).status_code == 400

    use_model(*[AIMessage(content="ok")] * (settings.chat_rate_limit_per_minute + 1))
    for _ in range(settings.chat_rate_limit_per_minute):
        assert client.post("/api/chat", headers=guest, json={"message": "Hi"}).status_code == 200
    assert client.post("/api/chat", headers=guest, json={"message": "Hi"}).status_code == 429


def test_think_filter_drops_reasoning_across_chunks():
    f = ThinkFilter()
    out = "".join(f.feed(chunk) for chunk in ["Hi <thi", "nk>secret plan</th", "ink>there", " <b>ok</b>"])
    assert out == "Hi there <b>ok</b>"
