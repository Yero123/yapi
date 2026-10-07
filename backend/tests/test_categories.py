from tests.conftest import category_id

NEW = {"name": "Groceries", "kind": "expense", "icon": "food", "color": "mint"}


def test_create_and_edit_category(client, guest):
    created = client.post("/api/categories", headers=guest, json=NEW)
    assert created.status_code == 201
    edited = client.patch(f"/api/categories/{created.json()['id']}", headers=guest, json={"name": "Market", "color": "blue"}).json()
    assert (edited["name"], edited["color"], edited["icon"]) == ("Market", "blue", "food")


def test_duplicate_name_ignores_case(client, guest):
    response = client.post("/api/categories", headers=guest, json={**NEW, "name": "shopping"})
    assert response.status_code == 409
    assert "already" in response.json()["detail"]


def test_unknown_icon_or_color_is_rejected(client, guest):
    assert client.post("/api/categories", headers=guest, json={**NEW, "icon": "rocket"}).status_code == 400
    assert client.post("/api/categories", headers=guest, json={**NEW, "color": "#ff0000"}).status_code == 400


def test_limit_can_be_set_and_cleared(client, guest):
    food = category_id(client, guest, "Food & Dining")
    assert client.patch(f"/api/categories/{food}", headers=guest, json={"monthly_limit_cents": 60000}).json()["monthly_limit_cents"] == 60000
    # an update that does not mention the limit keeps it
    assert client.patch(f"/api/categories/{food}", headers=guest, json={"name": "Food"}).json()["monthly_limit_cents"] == 60000
    assert client.patch(f"/api/categories/{food}", headers=guest, json={"monthly_limit_cents": None}).json()["monthly_limit_cents"] is None


def test_income_category_cannot_have_a_limit(client, guest):
    salary = category_id(client, guest, "Salary")
    assert client.patch(f"/api/categories/{salary}", headers=guest, json={"monthly_limit_cents": 1000}).status_code == 400
    assert client.post("/api/categories", headers=guest, json={**NEW, "kind": "income", "monthly_limit_cents": 1000}).status_code == 400


def test_delete_only_when_unused(client, guest):
    food = category_id(client, guest, "Food & Dining")
    health = category_id(client, guest, "Health")
    client.post("/api/transactions", headers=guest, json={"kind": "expense", "amount_cents": 500, "category_id": food, "occurred_on": "2026-09-10"})

    refused = client.delete(f"/api/categories/{food}", headers=guest)
    assert refused.status_code == 409
    assert "transactions" in refused.json()["detail"]
    assert client.delete(f"/api/categories/{health}", headers=guest).status_code == 204


def test_list_reports_the_months_total(client, guest):
    food = category_id(client, guest, "Food & Dining")
    for day, cents in (("2026-09-10", 500), ("2026-09-20", 250), ("2026-08-31", 9999)):
        client.post("/api/transactions", headers=guest, json={"kind": "expense", "amount_cents": cents, "category_id": food, "occurred_on": day})
    listed = client.get("/api/categories?month=2026-09", headers=guest).json()
    assert next(c for c in listed if c["id"] == food)["month_total_cents"] == 750
