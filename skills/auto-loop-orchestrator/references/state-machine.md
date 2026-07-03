# Auto Loop State Machine

This reference defines the global state ledger for an AI development loop. The orchestrator owns state transitions only. Stage-specific skills own artifact contents and validation.

## Run Directory

Default layout:

```text
.agent-runs/
└── <run-id>/
    ├── run-state.json
    ├── task-pack.json
    ├── ac-evidence.json
    ├── validation/
    ├── review/
    └── handoff.json
```

`run-state.json` may reference artifacts outside the run directory, such as `docs/features/<feature>/requests/YYYY-MM-DD-<task>.md`.

## States

Allowed state names:

| State | Owner | Meaning |
| --- | --- | --- |
| `initialized` | `auto-loop-orchestrator` | Run directory and initial ledger exist. |
| `task-pack` | `ai-tech-spec` | Tech spec has been converted to the minimal Maker-facing task pack. |
| `maker` | `maker-ai-workflow` | Maker is implementing from the controlling contract. |
| `maker-self-check` | `maker-ai-workflow` | Maker is recording AC evidence, validation, and request-log proof. |
| `test-gate` | `test-gate` | AC-mapped tests are being probed against the pre-change baseline for vacuous or mock-only coverage. |
| `review-diff` | `review-diff` | Independent correctness review is running or complete. |
| `review-fix` | `maker-ai-workflow` | Maker is fixing blocking review findings. |
| `refine-diff` | `refine-diff` | Maintainability and simplification review is running or complete. |
| `refine-apply` | `maker-ai-workflow` | Maker is applying accepted behavior-preserving refinement changes. |
| `post-refine-check` | `post-refine-check` | Final regression gate after refinement. |
| `handoff` | `auto-loop-orchestrator` or a handoff skill | Final delivery package is being written. |
| `done` | `auto-loop-orchestrator` | The loop is complete. |

## Status Values

Allowed `state.status` values:

- `running`
- `passed`
- `blocked`
- `failed`
- `done`

Use `blocked` when the next action is known but current gate failed. Use `failed` for script or infrastructure failure where the next action is not safely known.

## Default Transitions

| From | Default next after pass |
| --- | --- |
| `initialized` | `task-pack` |
| `task-pack` | `maker` |
| `maker` | `maker-self-check` |
| `maker-self-check` | `test-gate` |
| `test-gate` | `review-diff` |
| `review-diff` | `refine-diff` |
| `review-fix` | `review-diff` |
| `refine-diff` | `refine-apply` |
| `refine-apply` | `post-refine-check` |
| `post-refine-check` | `handoff` |
| `handoff` | `done` |

Blocked transitions:

| Blocked state | Next required |
| --- | --- |
| `test-gate` | `maker` |
| `review-diff` | `review-fix` |
| `refine-diff` | `review-diff` |
| `post-refine-check` | `refine-apply` |
| Any other state | Same state |

`test-gate` blocks back to `maker`: a vacuous or mock-only test means the Maker must write a test that actually pins the behavior; the flow then re-runs `maker-self-check` and `test-gate` naturally.

`refine-diff` blocks back to `review-diff` rather than looping on itself: per `refine-diff`'s own scope, a `blocked` gate there usually means the diff needs another correctness pass before simplification can safely proceed.

Use `pass --next <state>` only for explicit no-op or skipped stages. The override must be one of the allowed states.

## Artifact Kinds

Recommended artifact kind names:

- `task-pack`
- `request-log`
- `ac-evidence`
- `validation-plan`
- `validation-command`
- `test-gate`
- `review-diff`
- `review-fixes`
- `refine-diff`
- `refine-apply`
- `post-refine-check`
- `handoff`
- `other`

Register artifacts with `run-state.mjs attach` or stage transition commands. Artifact records contain path, SHA-256 hash, kind, related state, and timestamp.

## Mechanical Facts Only

Allowed in `run-state.json`:

- Paths and file hashes.
- Git root, branch, start head, current head, and dirty flags.
- State name, status, attempt counts, and `nextRequired`.
- Transition timestamps and artifact references.
- Gate labels as strings supplied by stage scripts or reports.
- Blocker reasons supplied at the time of blocking.

Do not store:

- Related files inferred from code search.
- Architecture summaries.
- Risk analysis.
- Review prose.
- Agent reasoning.
- Human-intended readiness unless backed by an explicit gate artifact.
