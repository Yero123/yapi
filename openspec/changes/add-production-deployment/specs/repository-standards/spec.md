## ADDED Requirements

### Requirement: No secrets in the repository
The repository SHALL NOT contain credentials in any commit, and SHALL document every configuration variable by name with an example file.

#### Scenario: Environment files
- **WHEN** a developer creates a `.env` file anywhere in the project
- **THEN** git ignores it, while `.env.example` remains tracked

#### Scenario: Secret pushed by mistake
- **WHEN** a commit containing a recognised credential is pushed
- **THEN** the push is blocked by the repository's secret protection

### Requirement: Checks gate main
The repository SHALL run backend tests, frontend lint and the frontend build on every pull request, and SHALL require them to pass before merging to `main`.

#### Scenario: Failing test
- **WHEN** a pull request breaks a backend test or the frontend build
- **THEN** its checks fail and it cannot be merged

#### Scenario: Direct push
- **WHEN** someone force-pushes or deletes `main`
- **THEN** the repository rejects it

### Requirement: Project documentation
The repository SHALL include a README covering purpose, architecture, local setup, configuration, tests and deployment, a license, and a security policy with a private reporting channel.

#### Scenario: New contributor
- **WHEN** a developer follows the README on a clean machine with the listed requirements
- **THEN** the app runs locally without any information from outside the repository

### Requirement: Dependency updates
The repository SHALL receive automated update proposals for backend, frontend and workflow dependencies.

#### Scenario: Outdated dependency
- **WHEN** a dependency has a newer version or a security advisory
- **THEN** a pull request proposing the update is opened and goes through the same checks
