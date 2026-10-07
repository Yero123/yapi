from tests.conftest import category_id


def add(client, guest, category, cents, day, kind="expense"):
    client.post("/api/transactions", headers=guest, json={"kind": kind, "amount_cents": cents, "category_id": category, "occurred_on": day})


def test_summary_for_a_month_with_data(client, guest):
    food, fun, salary = (category_id(client, guest, n) for n in ("Food & Dining", "Entertainment", "Salary"))
    client.patch(f"/api/categories/{food}", headers=guest, json={"monthly_limit_cents": 60000})
    client.patch(f"/api/categories/{fun}", headers=guest, json={"monthly_limit_cents": 15000})
    add(client, guest, food, 48600, "2026-09-10")
    add(client, guest, fun, 16800, "2026-09-12")
    add(client, guest, salary, 380000, "2026-09-01", kind="income")
    add(client, guest, food, 30000, "2026-08-20")
    add(client, guest, salary, 370000, "2025-10-01", kind="income")
    add(client, guest, food, 99900, "2025-09-30")  # one day before the 12-month window

    data = client.get("/api/dashboard/summary?month=2026-09", headers=guest).json()

    assert (data["income_cents"], data["expense_cents"]) == (380000, 65400)
    assert (data["previous_income_cents"], data["previous_expense_cents"]) == (0, 30000)

    assert [p["month"] for p in data["series"]] == ["2025-10", "2025-11", "2025-12", "2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09"]
    assert data["series"][0] == {"month": "2025-10", "income_cents": 370000, "expense_cents": 0}
    assert data["series"][-1] == {"month": "2026-09", "income_cents": 380000, "expense_cents": 65400}

    budgets = {b["category"]["name"]: (b["spent_cents"], b["limit_cents"]) for b in data["budgets"]}
    assert budgets == {"Food & Dining": (48600, 60000), "Entertainment": (16800, 15000)}  # Entertainment is over

    assert [(r["category"]["name"], r["amount_cents"]) for r in data["breakdown"]] == [("Food & Dining", 48600), ("Entertainment", 16800)]
    assert len(data["recent"]) == 3
    assert data["recent"][0]["occurred_on"] == "2026-09-12"


def test_summary_for_an_empty_month(client, guest):
    data = client.get("/api/dashboard/summary?month=2026-09", headers=guest).json()
    assert (data["income_cents"], data["expense_cents"]) == (0, 0)
    assert data["budgets"] == [] and data["breakdown"] == [] and data["recent"] == []
    assert len(data["series"]) == 12


def test_recent_is_capped_at_six(client, guest):
    food = category_id(client, guest, "Food & Dining")
    for day in range(1, 9):
        add(client, guest, food, 100, f"2026-09-{day:02d}")
    assert len(client.get("/api/dashboard/summary?month=2026-09", headers=guest).json()["recent"]) == 6
