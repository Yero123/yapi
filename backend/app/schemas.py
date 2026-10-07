import uuid
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

Kind = Literal["expense", "income"]


class GuestOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID


class CategoryIn(BaseModel):
    name: str = Field(min_length=1, max_length=60)
    kind: Kind
    icon: str
    color: str
    monthly_limit_cents: int | None = Field(default=None, gt=0)


class CategoryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=60)
    icon: str | None = None
    color: str | None = None
    monthly_limit_cents: int | None = Field(default=None, gt=0)


class CategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    name: str
    kind: Kind
    icon: str
    color: str
    monthly_limit_cents: int | None


class CategoryWithSpent(CategoryOut):
    month_total_cents: int


class TransactionIn(BaseModel):
    kind: Kind
    amount_cents: int
    category_id: uuid.UUID
    occurred_on: date
    description: str = Field(default="", max_length=200)


class TransactionUpdate(BaseModel):
    kind: Kind | None = None
    amount_cents: int | None = None
    category_id: uuid.UUID | None = None
    occurred_on: date | None = None
    description: str | None = Field(default=None, max_length=200)


class TransactionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    kind: Kind
    amount_cents: int
    description: str
    occurred_on: date
    category: CategoryOut


class BudgetOut(BaseModel):
    category: CategoryOut
    spent_cents: int
    limit_cents: int


class MonthPoint(BaseModel):
    month: str
    income_cents: int
    expense_cents: int


class BreakdownRow(BaseModel):
    category: CategoryOut
    amount_cents: int


class DashboardSummary(BaseModel):
    month: str
    income_cents: int
    expense_cents: int
    previous_income_cents: int
    previous_expense_cents: int
    budgets: list[BudgetOut]
    series: list[MonthPoint]
    breakdown: list[BreakdownRow]
    recent: list[TransactionOut]


class ChatIn(BaseModel):
    message: str = Field(min_length=1)


class ChatMessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    role: Literal["user", "assistant"]
    content: str
    tool_results: list | None
    created_at: datetime
