## ADDED Requirements

### Requirement: Month selection
The dashboard SHALL show data for one selected calendar month, defaulting to the current month, and SHALL let the guest choose another month.

#### Scenario: Default month
- **WHEN** a guest opens the dashboard
- **THEN** the current month is selected

#### Scenario: Change month
- **WHEN** a guest selects a different month
- **THEN** every section of the dashboard shows that month's data

### Requirement: Budget cards
The dashboard SHALL show one card per expense category that has a monthly limit, with the category's icon and color, the amount spent in the selected month, the limit, a progress bar and the percentage used.

#### Scenario: Budget within its limit
- **WHEN** the amount spent in a budget is at or below its limit
- **THEN** the card shows the amount left

#### Scenario: Budget over its limit
- **WHEN** the amount spent in a budget is above its limit
- **THEN** the card shows how much it is over, with a warning icon and a text label, not by color alone

#### Scenario: No budgets
- **WHEN** the guest has no category with a monthly limit
- **THEN** the budgets area explains that giving a category a limit creates a budget and links to the categories screen

### Requirement: Income versus expenses by month
The dashboard SHALL show a bar chart with two bars per month, income and expenses, for the 12 months ending at the selected month, together with the selected month's income and expense totals.

#### Scenario: View the chart
- **WHEN** a guest views the dashboard
- **THEN** the chart shows 12 months with an income bar and an expense bar each, and a legend naming both series

#### Scenario: Inspect a month
- **WHEN** a guest hovers or focuses a month in the chart
- **THEN** that month's income and expense amounts are shown

### Requirement: Spending by category
The dashboard SHALL show the selected month's total spending, a bar segmented by category color, and a table of expense categories with amount, share of the total and budget status.

#### Scenario: View the breakdown
- **WHEN** a guest views the dashboard for a month with expenses
- **THEN** categories are listed from highest to lowest amount and their shares add up to 100%

#### Scenario: Month without expenses
- **WHEN** the selected month has no expenses
- **THEN** the section says nothing has been spent in that month

### Requirement: Recent transactions
The dashboard SHALL show the latest transactions of the selected month with category icon, description, date and signed amount, and a link to the full list.

#### Scenario: View recent transactions
- **WHEN** a guest views the dashboard
- **THEN** up to six of the newest transactions are shown, incomes and expenses together

### Requirement: Dashboard reflects changes
The dashboard SHALL reflect a created, edited or deleted transaction or category without a page reload, whether the change was made through a form or through the assistant.

#### Scenario: Expense added through the form
- **WHEN** a guest saves a new expense
- **THEN** the budget card, totals, breakdown and recent transactions include it
