# Request Log Template

Use request logs for medium or complex implementation passes.

```markdown
# Request Log: <Task>

## Scope

<What this pass is allowed to change. Include non-goals when useful.>

## Controlling Docs

- <Spec, issue, requirements doc, or AC source read for this pass.>
- <Repo-specific agent instructions read for this pass, if any.>

## AC Evidence

| AC ID | Status | Proof | Files | Notes |
| --- | --- | --- | --- | --- |
| AC-001 | pass | `<command or manual scenario>` | `<files>` | `<why this proves the AC>` |

## Changes

- <Changed area and reason.>

## Verification

```bash
<command>
```

Result: <pass/fail/not run and why>

## Blockers

- <Only include real blockers. Use `None` if there are none.>

## Remaining Work

- <Follow-up work outside this pass. Use `None` if there is none.>
```

Keep the request log factual. It records implementation evidence and remaining work; it must not become the only source of requirements.
