# Security policy

## Reporting a vulnerability

Please do not open a public issue for a security problem.

Report it privately through GitHub: **Security → Report a vulnerability** on this repository ([direct link](https://github.com/Yero123/yapi/security/advisories/new)). Include what you found, how to reproduce it and what an attacker could do with it.

You can expect a first reply within a week. Please give a reasonable time for a fix before disclosing publicly.

## Scope

- The code in this repository and the public deployment built from it.
- Only the latest commit on `main` is supported.

## Things to know

- Yapi has no accounts. A guest id is a random UUID stored in the browser and sent as `X-Guest-Id`; it acts as a bearer secret for that guest's data. Reports that amount to "someone who has the id can read the data" are expected behaviour.
- Secrets are supplied through environment variables and are never committed. If you find a credential in the history, report it as a vulnerability.
