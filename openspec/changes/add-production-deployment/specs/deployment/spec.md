## ADDED Requirements

### Requirement: Publicly reachable app
The system SHALL serve the frontend and the API from a single public HTTPS origin, with the API under `/api`.

#### Scenario: First visit on the public URL
- **WHEN** a person opens the public URL in a browser with no stored guest id
- **THEN** the app loads over HTTPS, a guest is created through `/api` on the same origin, and the dashboard is shown

#### Scenario: Deep link
- **WHEN** a person opens or reloads a client-side route such as `/transactions` directly
- **THEN** the app loads that screen instead of a not-found page

#### Scenario: Streamed assistant reply
- **WHEN** a guest sends a chat message on the public URL
- **THEN** the reply appears progressively while it is generated, not all at once at the end

### Requirement: Automatic delivery from main
The system SHALL deploy the frontend and the backend from the `main` branch without manual steps, and only after continuous integration passes.

#### Scenario: Merge to main
- **WHEN** a change is merged to `main` and its checks pass
- **THEN** the frontend and the backend are rebuilt and released with that change

#### Scenario: Failing checks
- **WHEN** a commit on `main` fails its checks
- **THEN** the backend is not released and the previous version keeps serving

#### Scenario: Pull request preview
- **WHEN** a pull request is opened
- **THEN** a preview of the frontend is published on its own URL

### Requirement: Migrations applied before release
The system SHALL bring the production database schema up to date before a new backend version receives traffic.

#### Scenario: Release with a new migration
- **WHEN** a backend version containing a new migration is deployed
- **THEN** the migration is applied before that version starts serving

#### Scenario: Migration fails
- **WHEN** a migration fails during deployment
- **THEN** the release is aborted and the previous version keeps serving

### Requirement: Health check covers the database
The system SHALL expose a health endpoint that reports unhealthy when the database cannot be reached.

#### Scenario: Healthy
- **WHEN** the health endpoint is called and the database answers
- **THEN** it responds with success

#### Scenario: Database unreachable
- **WHEN** the health endpoint is called and the database does not answer
- **THEN** it responds with a server error status

### Requirement: Configuration from the environment
The system SHALL read every environment-specific value and secret from environment variables supplied by the host, with defaults that suit local development.

#### Scenario: Production secrets
- **WHEN** the backend starts in production
- **THEN** the database connection string and the LLM key come from the host's variables and are not present in the repository or the container image

#### Scenario: Assistant without a key
- **WHEN** the backend runs with no LLM key
- **THEN** every feature except the assistant works and the assistant reports that it is unavailable

### Requirement: Database closed to direct public access
The system SHALL allow data access only through the backend API.

#### Scenario: Data API request
- **WHEN** someone queries a Yapi table through the database provider's public data API with the publishable key
- **THEN** no rows are returned and no write is accepted
