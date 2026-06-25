---
name: auto-loop-orchestrator
description: Coordinate an end-to-end AI development loop with one global run-state.json, artifact ledger, and deterministic state transitions. Use when a user asks to run or design an auto-loop / Maker-Reviewer-Refine pipeline across ai-discovery-collision, ai-tech-spec, maker-ai-workflow, review-diff, refine-diff, and post-refine-check. Not for writing the technical spec, implementing code, reviewing diffs, or validating a stage-specific artifact by itself.
---

# Auto Loop Orchestrator

Use this skill as the global coordinator for an AI development loop. It owns the run directory, `run-state.json`, state transitions, and artifact registry. It does not own the semantics of any stage artifact.

## Scope

Use this skill for:

- Starting or resuming an `.agent-runs/<run-id>/` directory.
- Recording which stage the loop is in.
- Registering stage artifacts such as `task-pack.json`, `ac-evidence.json`, validation outputs, review reports, refine reports, post-refine reports, and handoff files.
- Deciding the next mechanical stage from the explicit state machine.
- Checking that registered artifact files still exist and match their recorded hashes.

Do not use this skill to:

- Create feasibility studies, requirements, tech specs, or task packs. Use `ai-tech-spec`.
- Implement code, request logs, AC evidence, or tests. Use `maker-ai-workflow`.
- Review correctness. Use `review-diff`.
- Review maintainability or simplification. Use `refine-diff`.
- Run final regression verification after refinement. Use `post-refine-check`.
- Parse stage reports for business meaning. Stage-specific skills own those schemas and checks.

## Core Rules

- Keep exactly one global `run-state.json` for a loop.
- Let stage skills own their own scripts and report schemas.
- Store only mechanical facts in `run-state.json`: paths, hashes, git refs, state names, timestamps, transitions, gates, blockers, and artifact references.
- Do not let agents hand-edit `run-state.json`. Use `scripts/run-state.mjs` for init, transition, attach, refresh, and check operations.
- Do not infer `current` from chat history, changed files, or report prose. Advance state only through explicit `enter`, `pass`, or `block` commands.
- Treat `nextRequired` as a mechanical suggestion from the state machine, not as proof that the stage has been completed.
- If a stage artifact changes after registration, rerun the relevant stage or reattach the artifact intentionally.

## Workflow

1. Establish the controlling tech spec path or feature directory.
2. Read `references/state-machine.md` before creating or resuming a run.
3. Initialize the run state:

```bash
node ${CLAUDE_PLUGIN_ROOT}/skills/auto-loop-orchestrator/scripts/run-state.mjs init docs/features/<feature>/2-tech-spec.md
```

4. When a stage begins, record it:

```bash
node ${CLAUDE_PLUGIN_ROOT}/skills/auto-loop-orchestrator/scripts/run-state.mjs enter .agent-runs/<run-id> maker
```

5. When a stage produces an artifact, attach it:

```bash
node ${CLAUDE_PLUGIN_ROOT}/skills/auto-loop-orchestrator/scripts/run-state.mjs attach .agent-runs/<run-id> ac-evidence .agent-runs/<run-id>/ac-evidence.json
```

6. When a stage passes, record the transition:

```bash
node ${CLAUDE_PLUGIN_ROOT}/skills/auto-loop-orchestrator/scripts/run-state.mjs pass .agent-runs/<run-id> maker-self-check --artifact .agent-runs/<run-id>/ac-evidence.json
```

7. When a stage blocks, record the blocker and next mechanical stage:

```bash
node ${CLAUDE_PLUGIN_ROOT}/skills/auto-loop-orchestrator/scripts/run-state.mjs block .agent-runs/<run-id> review-diff --artifact .agent-runs/<run-id>/review/review-diff.json --reason "P1 findings remain"
```

8. Before handing work to the next agent, check the ledger:

```bash
node ${CLAUDE_PLUGIN_ROOT}/skills/auto-loop-orchestrator/scripts/run-state.mjs check .agent-runs/<run-id>
```

9. Continue by loading the stage-specific skill named by `nextRequired`.

## State Flow

Default flow:

```text
initialized
  -> task-pack
  -> maker
  -> maker-self-check
  -> review-diff
  -> refine-diff
  -> refine-apply
  -> post-refine-check
  -> handoff
  -> done
```

Repair loops:

```text
review-diff blocked -> review-fix -> review-diff
post-refine-check blocked -> refine-apply -> post-refine-check
```

Use `--next <state>` with `pass` only when the default next state is mechanically wrong, such as skipping `refine-apply` after a `refine-diff` report that explicitly requires no changes.

## Resource Loading

Load only the reference needed:

- For allowed states, gate outcomes, transition behavior, and artifact kinds, read `references/state-machine.md`.
- For machine-readable shape of `run-state.json`, read `references/run-state-schema.json`.

## Scripts

- `scripts/run-state.mjs init <feature-dir|2-tech-spec.md> [--run-dir <dir>] [--task-pack <file>] [--request-log <file>] [--force]`
- `scripts/run-state.mjs status <run-dir|run-state.json>`
- `scripts/run-state.mjs next <run-dir|run-state.json>`
- `scripts/run-state.mjs refresh <run-dir|run-state.json>`
- `scripts/run-state.mjs enter <run-dir|run-state.json> <state> [--artifact <file>] [--note <text>]`
- `scripts/run-state.mjs pass <run-dir|run-state.json> <state> [--artifact <file>] [--gate <value>] [--next <state>] [--note <text>]`
- `scripts/run-state.mjs block <run-dir|run-state.json> <state> [--artifact <file>] [--reason <text>]`
- `scripts/run-state.mjs attach <run-dir|run-state.json> <kind> <file>`
- `scripts/run-state.mjs check <run-dir|run-state.json>`

The script is deterministic and dependency-free. Run it with Node.js.

## Output

When using this skill, finish with:

- Current run directory.
- Current state and next required state.
- Artifacts registered or checked.
- Any blockers recorded.
- Which stage-specific skill should run next.
