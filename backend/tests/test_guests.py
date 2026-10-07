import uuid

from tests.conftest import category_id


def test_new_guest_gets_default_categories(client, guest):
    categories = client.get("/api/categories", headers=guest).json()
    kinds = {c["kind"] for c in categories}
    assert kinds == {"expense", "income"}
    assert all(c["icon"] and c["color"] for c in categories)
    assert all(c["monthly_limit_cents"] is None for c in categories)


def test_missing_or_unknown_guest_is_rejected(client):
    assert client.get("/api/categories").status_code == 401
    assert client.get("/api/categories", headers={"X-Guest-Id": "nope"}).status_code == 401
    assert client.get("/api/categories", headers={"X-Guest-Id": str(uuid.uuid4())}).status_code == 401


def test_guests_cannot_reach_each_others_records(client, guest):
    other = {"X-Guest-Id": client.post("/api/guests").json()["id"]}
    food = category_id(client, guest, "Food & Dining")
    created = client.post("/api/transactions", headers=guest, json={"kind": "expense", "amount_cents": 500, "category_id": food, "occurred_on": "2026-09-10"}).json()

    assert client.get("/api/transactions?month=2026-09", headers=other).json() == []
    assert client.patch(f"/api/transactions/{created['id']}", headers=other, json={"amount_cents": 1}).status_code == 404
    assert client.delete(f"/api/transactions/{created['id']}", headers=other).status_code == 404
    assert client.patch(f"/api/categories/{food}", headers=other, json={"name": "Mine"}).status_code == 404
    # another guest's category cannot be used for a transaction
    assert client.post("/api/transactions", headers=other, json={"kind": "expense", "amount_cents": 500, "category_id": food, "occurred_on": "2026-09-10"}).status_code == 404
