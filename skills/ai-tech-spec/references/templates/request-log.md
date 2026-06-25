# Request Log Template

Use this template for `docs/features/<feature>/requests/YYYY-MM-DD-<task>.md` to track a concrete development pass, implementation slice, test pass, review response, or follow-up. Request logs are execution records; they should point back to the main tech spec rather than redefining the whole feature.

Delete sections that do not apply. Keep status factual and easy to resume from.

````markdown
# <Feature / Task> - <Implementation / Test Coverage / Follow-up>

> **Doc class**: Request log
> **Created**: YYYY-MM-DD
> **Status**: Draft | In Progress | Blocked | Done
> **Priority**: P0 | P1 | P2 | P3
> **Tech Spec**: [2-tech-spec.md](../2-tech-spec.md)
> **Owner**: <person/team/agent>

## Background

<One paragraph: why this specific request exists. Link to the relevant tech spec section, previous request log, issue, or review finding.>

## Scope

| Scope | Description |
| --- | --- |
| In | `<what this request will change or verify>` |
| Out | `<what is intentionally left for another request>` |

## Related Files

| File | Action | Description |
| --- | --- | --- |
| `<path>` | `<create/modify/review/reference>` | `<why relevant>` |

## Requirements

- `<concrete requirement for this pass>`
- `<concrete requirement for this pass>`

## Acceptance Criteria

- [ ] `<specific behavior/result this request must achieve>`
- [ ] `<specific regression/compatibility check>`
- [ ] `<review/test/precommit requirement if applicable>`

## Progress

| Phase | Status | Notes |
| --- | --- | --- |
| Analysis | `<todo/in progress/done>` | `<notes>` |
| Development | `<todo/in progress/done>` | `<notes>` |
| Testing | `<todo/in progress/done>` | `<notes>` |
| Review | `<todo/in progress/done>` | `<notes>` |
| Acceptance | `<todo/in progress/done>` | `<notes>` |

## Implementation Notes

<Record important choices made during implementation. Keep this factual: what changed and why. If a choice changes the contract, update `2-tech-spec.md` too.>

## Verification Results

| Check | Command / Method | Result | Notes |
| --- | --- | --- | --- |
| Unit | `<command>` | `<pass/fail/not run>` | `<summary>` |
| Integration | `<command>` | `<pass/fail/not run>` | `<summary>` |
| Manual | `<curl/scenario>` | `<pass/fail/not run>` | `<summary>` |
| Review | `<review method>` | `<pass/fail/not run>` | `<summary>` |

## Blockers / Follow-ups

| Item | Owner | Status | Notes |
| --- | --- | --- | --- |
| `<blocker/follow-up>` | `<owner>` | `<open/done>` | `<notes>` |

## Handoff Notes

<What the next agent/engineer needs to know to continue safely. Include remaining files, commands, and known risks.>

## References

- Tech Spec: [2-tech-spec.md](../2-tech-spec.md)
- `<related request/doc/issue>`
````

## Senior Review Guidance

A good request log makes the work resumable. It should answer: what was attempted, what changed, what passed, what failed or was not run, and what remains. Do not hide failed verification; record it with the next action.
