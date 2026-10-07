## ADDED Requirements

### Requirement: Navigation
The app SHALL provide a sidebar with links to the dashboard, transactions and categories screens, and SHALL mark the current screen.

#### Scenario: Navigate between screens
- **WHEN** a guest selects a sidebar link
- **THEN** that screen is shown, the link is marked as current, and the browser address reflects the screen

### Requirement: Guest identity block
The sidebar SHALL show that the person is using the app as a guest and SHALL show Google sign-in as not yet available.

#### Scenario: View the identity block
- **WHEN** a guest views the sidebar
- **THEN** it shows "Guest" and a disabled "Sign in with Google" control marked as coming soon

### Requirement: Light and dark themes
The app SHALL offer a light and a dark theme, SHALL default to the device's preference, and SHALL remember the guest's choice.

#### Scenario: Switch theme
- **WHEN** a guest toggles dark mode
- **THEN** the whole app switches theme and keeps it on the next visit

### Requirement: Collapsible assistant panel
The app SHALL show the assistant in a panel docked on the right on wide screens that the guest can collapse and reopen from any screen.

#### Scenario: Collapse the panel
- **WHEN** a guest collapses the assistant panel
- **THEN** the content takes the full width and a control to reopen the assistant is shown

### Requirement: Responsive layout
The app SHALL be usable on phone-width screens: navigation remains reachable, the assistant opens as a full-screen sheet, and wide tables scroll inside their container rather than the page.

#### Scenario: Phone width
- **WHEN** the app is viewed at a width of 390px
- **THEN** there is no horizontal page scroll and every screen and the assistant are reachable

### Requirement: Visual style
The app SHALL follow the approved mockup: soft raised and inset surfaces, the green accent with dark text on it, pastel category colors, and text that meets a contrast ratio of at least 4.5:1 against its background.

#### Scenario: Primary action
- **WHEN** a primary button is shown
- **THEN** it uses the green accent with dark green text

### Requirement: Loading and error states
Every screen SHALL show a loading state while its data is being fetched and an error state with a retry action when fetching fails.

#### Scenario: Backend unreachable
- **WHEN** a screen cannot load its data
- **THEN** it says the data could not be loaded and offers to try again
