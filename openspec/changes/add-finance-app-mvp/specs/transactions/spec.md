## ADDED Requirements

### Requirement: Record a transaction
The system SHALL let a guest record an expense or an income with an amount, a category of the matching type, a date and an optional description.

#### Scenario: Record an expense
- **WHEN** a guest submits an expense with a positive amount, an expense category and a date
- **THEN** the transaction is saved and appears in the transactions list and on the dashboard

#### Scenario: Record an income
- **WHEN** a guest submits an income with a positive amount, an income category and a date
- **THEN** the transaction is saved and counts toward that month's income

#### Scenario: Invalid amount
- **WHEN** a guest submits a transaction with an amount that is zero, negative or not a number
- **THEN** the transaction is not saved and the form says the amount must be greater than zero

#### Scenario: Category of the wrong type
- **WHEN** a transaction is submitted as an expense with an income category, or as an income with an expense category
- **THEN** the transaction is not saved

#### Scenario: Date defaults to today
- **WHEN** a guest opens the add transaction form
- **THEN** the date field is prefilled with today's date

### Requirement: Edit and delete a transaction
The system SHALL let a guest edit any field of a transaction and delete a transaction.

#### Scenario: Edit a transaction
- **WHEN** a guest changes the amount, category, date or description of a transaction and saves
- **THEN** the transaction and every total that includes it reflect the change

#### Scenario: Delete a transaction
- **WHEN** a guest deletes a transaction and confirms
- **THEN** the transaction is removed and every total that included it is updated

### Requirement: List and filter transactions
The system SHALL list a guest's transactions newest first and SHALL let the guest filter them by type, category and month.

#### Scenario: Default list
- **WHEN** a guest opens the transactions screen
- **THEN** the current month's transactions are listed newest first with description, category, date and signed amount

#### Scenario: Filter by type
- **WHEN** a guest selects "Expenses"
- **THEN** only expenses are listed

#### Scenario: No results
- **WHEN** the selected filters match no transactions
- **THEN** the list says there are no transactions for those filters and offers to add one

### Requirement: Amounts in US dollars
The system SHALL store amounts exactly to the cent and SHALL display them as US dollars, with incomes prefixed by a plus sign and expenses by a minus sign.

#### Scenario: Display an expense
- **WHEN** an expense of 84.20 is listed
- **THEN** it is shown as -$84.20
