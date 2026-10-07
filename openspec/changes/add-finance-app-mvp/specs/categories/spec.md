## ADDED Requirements

### Requirement: Create and edit categories
The system SHALL let a guest create and edit categories with a name, a type (expense or income), an icon chosen from a fixed set and a color chosen from a fixed palette.

#### Scenario: Create a category
- **WHEN** a guest submits a new category with a name, type, icon and color
- **THEN** the category is saved and appears in the categories table

#### Scenario: Duplicate name
- **WHEN** a guest submits a category whose name matches an existing category of theirs, ignoring letter case
- **THEN** the category is not saved and the form says a category with that name already exists

#### Scenario: Edit a category
- **WHEN** a guest changes the name, icon or color of a category
- **THEN** the change is saved and shown everywhere the category appears

### Requirement: Optional monthly limit makes a budget
The system SHALL let an expense category carry an optional monthly limit, and SHALL treat an expense category with a limit as a budget that resets each calendar month.

#### Scenario: Set a limit
- **WHEN** a guest sets a monthly limit on an expense category
- **THEN** the category is shown as a budget on the dashboard

#### Scenario: Remove a limit
- **WHEN** a guest clears the monthly limit of a category
- **THEN** the category is no longer shown as a budget and its transactions are unchanged

#### Scenario: Limit on an income category
- **WHEN** a guest tries to set a monthly limit on an income category
- **THEN** the limit is not accepted

### Requirement: Categories table
The system SHALL show all of a guest's categories in a table with icon, color, name, type, monthly limit and the amount recorded in the current month.

#### Scenario: View categories
- **WHEN** a guest opens the categories screen
- **THEN** every category is listed, and categories without a limit show "No limit"

### Requirement: Delete a category
The system SHALL let a guest delete a category that has no transactions and SHALL refuse to delete one that has transactions.

#### Scenario: Delete an unused category
- **WHEN** a guest deletes a category with no transactions
- **THEN** the category is removed

#### Scenario: Delete a category in use
- **WHEN** a guest tries to delete a category that has transactions
- **THEN** the category is kept and the guest is told it still has transactions
