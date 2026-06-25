# Execution Protocol

## Purpose

Use this protocol when implementing from a spec, issue, acceptance criteria list, or approved implementation brief. The Maker's job is to satisfy the contract and prove it, not to broaden the task.

## Steps

1. Identify the controlling contract
   - Prefer the spec or AC list explicitly named by the user.
   - If none is named, look for nearby feature docs such as `docs/features/<feature>/2-tech-spec.md`.
   - Read repo-specific agent instructions when present.

2. Extract ACs
   - Use existing AC labels when present.
   - Assign `AC-001`, `AC-002`, etc. when labels are missing.
   - Preserve labels for the whole implementation pass.

3. Plan by AC
   - Map each AC to likely files, tests, and verification.
   - Identify non-goals and out-of-scope areas.
   - If an AC is contradictory or impossible, stop and ask for spec review.

4. Implement narrowly
   - Prefer existing project patterns.
   - Keep unrelated refactors out.
   - Do not edit ACs unless the task explicitly asks for it.

5. Verify
   - Run tests/checks that prove the ACs.
   - Add focused tests where evidence is missing.
   - Record failures honestly.

6. Record evidence
   - Use the AC evidence format from `ac-traceability.md`.
   - For medium or complex work, create or update a request log using `request-log-template.md`.

7. Finish or block
   - Finish only when every AC has proof or a justified exemption.
   - Block when the remaining work requires a user decision, spec change, missing credential, unavailable service, or unsafe scope expansion.

## Completion Standard

Do not say the task is done because code was changed. Say it is done only when the AC evidence proves completion.
