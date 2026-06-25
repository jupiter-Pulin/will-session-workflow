# Testing Strategy

Testing scales with the depth and risk of the controlling documents.

## Small Requests

Use when the task only has a tech spec, issue, or AC list.

Required:

- Unit tests or targeted static checks mapped to every AC.
- A clear reason for any AC that cannot be automated.

Feasibility and requirements documents are not required for small requests.

## Medium Requests

Use when the task has a tech spec plus multiple touched modules, a request log, or meaningful integration boundaries.

Required:

- Unit tests for local logic.
- Integration tests for module, API, persistence, cache, or permission boundaries when relevant.
- AC evidence table linking each test/check to AC IDs.

## Complex Requests

Use when the task has requirements, feasibility decisions, migrations, user-visible workflows, external services, or high-risk architecture choices.

Required:

- Unit tests for core logic.
- Integration tests for data flow, business rules, permissions, errors, and compatibility.
- E2E tests for critical user-visible paths when the AC depends on full workflow behavior.
- Verification for feasibility risks that the selected option depends on, or an explicit note that the risk remains unverified.

## Choosing E2E

Use E2E when an AC depends on:

- Browser or app navigation.
- Cross-service behavior.
- Auth or permission flows.
- User-visible state persistence.
- Regression-prone workflows that unit tests cannot prove.

Do not add broad E2E tests merely to look thorough. Tie each one to AC evidence.

## Test Failure Rule

If a relevant test/check fails, Maker is not done. Fix the cause, narrow the scope if the failure is unrelated, or record a blocker with evidence.
