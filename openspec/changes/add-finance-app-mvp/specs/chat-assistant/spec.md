## ADDED Requirements

### Requirement: Converse with the assistant
The system SHALL provide an assistant the guest can message in natural language, and SHALL display the reply progressively as it is produced.

#### Scenario: Send a message
- **WHEN** a guest sends a message
- **THEN** the message appears in the conversation and the assistant's reply is displayed as it arrives

#### Scenario: Assistant unavailable
- **WHEN** the assistant cannot produce a reply
- **THEN** the guest sees that the assistant is unavailable and can send the message again

### Requirement: Create transactions by chat
The assistant SHALL be able to create an expense or an income from a message, choosing the category from the guest's existing categories and using today's date when none is given.

#### Scenario: Create an expense
- **WHEN** a guest writes "Add a $12 lunch expense"
- **THEN** an expense of $12.00 is created in a fitting expense category and the reply includes a card showing the created transaction

#### Scenario: Missing amount
- **WHEN** a guest asks to add an expense without stating an amount
- **THEN** the assistant asks for the amount and creates nothing

### Requirement: Manage categories and budgets by chat
The assistant SHALL be able to create a category and to set or change the monthly limit of an expense category.

#### Scenario: Set a budget
- **WHEN** a guest writes "Set a $300 budget for Shopping"
- **THEN** the Shopping category's monthly limit becomes $300 and the reply includes a card showing the updated budget

#### Scenario: Unknown category
- **WHEN** a guest asks to set a budget for a category that does not exist
- **THEN** the assistant says the category does not exist and offers to create it

### Requirement: Answer questions about the guest's data
The assistant SHALL answer questions about spending, income, budgets and transactions using the guest's recorded data, and SHALL NOT state figures that are not derived from that data.

#### Scenario: Spending in a category
- **WHEN** a guest asks how much they spent on food this month
- **THEN** the reply states the amount recorded in that category for the current month

#### Scenario: Budgets over their limit
- **WHEN** a guest asks which budget they are over
- **THEN** the reply names each budget whose spending exceeds its limit, or says none is over

#### Scenario: No data
- **WHEN** a guest asks about a period with no recorded transactions
- **THEN** the assistant says there is nothing recorded for that period

### Requirement: Assistant acts only on the current guest's data
The assistant SHALL read and change only the data of the guest who sent the message, regardless of what the message says.

#### Scenario: Message names another identity
- **WHEN** a message asks the assistant to show or change another person's or guest's data
- **THEN** the assistant only has access to the sender's own data

### Requirement: App reflects assistant actions
The system SHALL update the dashboard, transactions and categories screens when the assistant creates or changes a record, without a page reload.

#### Scenario: Expense created by chat
- **WHEN** the assistant creates an expense
- **THEN** the dashboard and the transactions list include it

### Requirement: Conversation history
The system SHALL keep the guest's conversation so it is shown again on a later visit.

#### Scenario: Returning to the conversation
- **WHEN** a guest reopens the app
- **THEN** the earlier messages and their result cards are shown in the assistant panel

### Requirement: Suggested prompts
The assistant panel SHALL offer suggested prompts that send their text when chosen.

#### Scenario: Use a suggestion
- **WHEN** a guest selects a suggested prompt
- **THEN** it is sent as their message
