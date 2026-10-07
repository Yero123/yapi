## ADDED Requirements

### Requirement: Guest created on first visit
The system SHALL create an anonymous guest when the app is opened without a stored guest id, and SHALL keep that id in the browser for later visits.

#### Scenario: First visit
- **WHEN** a person opens the app in a browser with no stored guest id
- **THEN** a guest is created, its id is stored in the browser, and the app loads without asking for any account details

#### Scenario: Returning visit
- **WHEN** a person opens the app in a browser that has a stored guest id
- **THEN** no new guest is created and the data recorded earlier is shown

### Requirement: Default categories for a new guest
The system SHALL give every new guest a starting set of expense and income categories, each with a name, icon and color.

#### Scenario: New guest sees categories
- **WHEN** a guest is created
- **THEN** the guest has default expense categories and default income categories available immediately

### Requirement: Sample data for a new guest
The system SHALL give every new guest example data so the first visit is not empty: monthly limits on some expense categories, typical expenses and incomes for the last 12 months with none dated in the future, and one assistant exchange in which an expense was created. The sample records SHALL be ordinary records the guest can edit or delete.

#### Scenario: First visit shows a populated dashboard
- **WHEN** a new guest opens the dashboard
- **THEN** it shows budgets, 12 months of income and expenses, spending by category and recent transactions

#### Scenario: First visit shows a sample conversation
- **WHEN** a new guest opens the assistant panel
- **THEN** it shows a message asking to add an expense and a reply with a card for the created expense, and that expense is in the transactions list

### Requirement: Data scoped to the guest
The system SHALL return and modify only the data that belongs to the guest identified by the request.

#### Scenario: Another guest's record
- **WHEN** a request identified as guest A asks for or tries to change a record that belongs to guest B
- **THEN** the system responds as if the record does not exist

#### Scenario: Unknown guest id
- **WHEN** a request carries a guest id that does not exist or carries none
- **THEN** the request is rejected as unauthorized and the app creates a new guest
