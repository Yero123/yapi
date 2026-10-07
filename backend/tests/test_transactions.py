import pytest

from tests.conftest import category_id


def add(client, guest, category, **fields):
    body = {"kind": "expense", "amount_cents": 1000, "category_id": category, "occurred_on": "2026-09-15", **fields}
    return client.post("/api/transactions", headers=guest, json=body)


def test_record_expense_and_income(client, guest):
    food, salary = category_id(client, guest, "Food & Dining"), category_id(client, guest, "Salary")
    expense = add(client, guest, food, amount_cents=8420, description="  Groceries ")
    income = add(client, guest, salary, kind="income", amount_cents=380000)
    assert expense.status_code == 201 and income.status_code == 201
    assert expense.json()["description"] == "Groceries"
    assert expense.json()["category"]["name"] == "Food & Dining"


@pytest.mark.parametrize("cents", [0, -500])
def test_amount_must_be_positive(client, guest, cents):
    response = add(client, guest, category_id(client, guest, "Food & Dining"), amount_cents=cents)
    assert response.status_code == 400
    assert "greater than zero" in response.json()["detail"]


def test_category_must_match_the_kind(client, guest):
    assert add(client, guest, category_id(client, guest, "Salary")).status_code == 400
    assert add(client, guest, category_id(client, guest, "Food & Dining"), kind="income").status_code == 400


def test_edit_and_delete(client, guest):
    food, transport = category_id(client, guest, "Food & Dining"), category_id(client, guest, "Transport")
    created = add(client, guest, food).json()
    edited = client.patch(f"/api/transactions/{created['id']}", headers=guest, json={"amount_cents": 4850, "category_id": transport, "occurred_on": "2026-09-25"}).json()
    assert (edited["amount_cents"], edited["category"]["name"], edited["occurred_on"]) == (4850, "Transport", "2026-09-25")
    # an edit cannot leave the transaction in a category of the other kind
    assert client.patch(f"/api/transactions/{created['id']}", headers=guest, json={"kind": "income"}).status_code == 400

    assert client.delete(f"/api/transactions/{created['id']}", headers=guest).status_code == 204
    assert client.get("/api/transactions?month=2026-09", headers=guest).json() == []


def test_list_is_newest_first_and_filters(client, guest):
    food, salary = category_id(client, guest, "Food & Dining"), category_id(client, guest, "Salary")
    add(client, guest, food, occurred_on="2026-09-05", description="early")
    add(client, guest, food, occurred_on="2026-09-28", description="late")
    add(client, guest, salary, kind="income", occurred_on="2026-09-01", description="pay")
    add(client, guest, food, occurred_on="2026-08-30", description="last month")

    september = client.get("/api/transactions?month=2026-09", headers=guest).json()
    assert [t["description"] for t in september] == ["late", "early", "pay"]
    assert [t["description"] for t in client.get("/api/transactions?month=2026-09&kind=income", headers=guest).json()] == ["pay"]
    assert len(client.get(f"/api/transactions?month=2026-09&category_id={food}", headers=guest).json()) == 2
    assert client.get("/api/transactions?month=2026-13", headers=guest).status_code == 400
