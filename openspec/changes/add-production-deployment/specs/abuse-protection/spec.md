## ADDED Requirements

### Requirement: Guest creation limited per client address
The system SHALL limit how many guests one client address can create in a period of time.

#### Scenario: Under the limit
- **WHEN** a client address creates a guest and is under the limit
- **THEN** the guest is created

#### Scenario: Over the limit
- **WHEN** a client address has reached the limit and asks for another guest
- **THEN** the request is rejected as rate limited and no guest is created

### Requirement: Chat limited per client address
The system SHALL limit how many chat messages one client address can send in a period of time, in addition to the limit per guest.

#### Scenario: Many guests from one address
- **WHEN** one client address sends chat messages using several guest ids and reaches the address limit
- **THEN** further messages are rejected as rate limited whichever guest id is used, and the model is not called

#### Scenario: Limit explained
- **WHEN** a chat message is rejected as rate limited
- **THEN** the assistant panel tells the person to wait and try again

### Requirement: Client address taken from the trusted proxy
The system SHALL identify the client by the visitor's address as forwarded by the hosting proxies, not by the proxy's own address.

#### Scenario: Two visitors
- **WHEN** two visitors on different networks use the public URL
- **THEN** each is counted against its own limit

### Requirement: Spend ceiling at the provider
The system SHALL operate with a spending cap configured on the LLM provider key.

#### Scenario: Cap reached
- **WHEN** the provider refuses a call because the cap is reached
- **THEN** the assistant reports that it is unavailable and the rest of the app keeps working
