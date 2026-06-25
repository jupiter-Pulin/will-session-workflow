# AC Traceability

## AC IDs

Use existing labels when the spec has them. If labels are missing, assign stable IDs in document order:

```text
AC-001
AC-002
AC-003
```

Do not renumber during the same implementation pass.

## Status Values

- `pass`: The AC is implemented and supported by proof.
- `blocked`: The AC cannot be completed without a user/spec decision, unavailable dependency, or unsafe scope expansion.
- `not-automatable`: The AC is verified by manual/static review with a concrete reason.
- `deferred`: The controlling contract explicitly allows deferral.

## Evidence Table

Use this table in request logs or final implementation notes:

```markdown
## AC Evidence

| AC ID | Status | Proof | Files | Notes |
| --- | --- | --- | --- | --- |
| AC-001 | pass | `npm test -- user.test.ts` | `src/user.ts`, `test/user.test.ts` | Covers success and validation error. |
| AC-002 | not-automatable | Manual check: copy reviewed in UI at `/settings` | `src/settings/page.tsx` | Visual wording only. |
```

## Proof Quality

Strong proof:

- Names the command, test, static check, or manual scenario.
- Points to changed code or test files.
- Would fail or visibly differ if the AC regressed.

Weak proof:

- "Works now."
- "Implemented."
- "Tested manually" without scenario.
- A command that does not map to the AC.

## Handling Missing Evidence

If proof is missing, do one of:

- Add or update tests.
- Run a targeted check and record the result.
- Mark `not-automatable` with a reason and manual scenario.
- Mark `blocked` and explain what decision or resource is needed.
