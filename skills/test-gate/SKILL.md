---
name: test-gate
description: Verify that tests produced by a MakerAgent actually falsify the acceptance criteria they claim to cover, not just pass. Use after maker-self-check and before review-diff, when ac-evidence.json claims a test proves an AC and that claim needs mechanical proof, or when checking whether AC coverage relies on mocks instead of real integration/e2e behavior. Not for correctness review of the implementation itself (use review-diff), not for style or simplification (use refine-diff), and not for re-deriving AC status from scratch (use maker-ai-workflow).
---

# Test Gate

## Overview

A green test suite is not proof that a test pins the behavior an AC describes. A test can pass against both the new code and the old code — vacuously — because it mocks away the exact path that changed, or never exercises the branch the AC is about. This skill makes "the test proves the AC" falsifiable instead of self-reported.

The mechanism is a controlled experiment, not a read of the code: run each AC's test command against the pre-change baseline in an isolated `git worktree`. If the test still passes against the old code, it does not prove the new behavior and the AC is not actually covered, regardless of what `ac-evidence.json` claims.

## Scope

Use this skill for:

- Validating that `ac-evidence.json` entries with `status: "pass"` have tests that actually fail on the pre-change baseline.
- Judging whether AC-relevant tests exercise real behavior (integration/e2e, real I/O, real modules) or are fully mocked past the changed path.

Do not use this skill for:

- Reviewing implementation correctness or finding bugs; use `review-diff`.
- Judging code quality, duplication, or premature abstraction; use `refine-diff`.
- Writing or fixing tests; that is `maker-ai-workflow`'s job. This skill only verifies, and blocks back to `maker` when verification fails.

## Workflow

1. Confirm `maker-self-check` has passed and `ac-evidence.json` exists with at least one AC at `status: "pass"`.
2. Identify the pre-change baseline ref (the git ref or commit the MakerAgent started from; `run-state.json` records this as the run's start head when using `auto-loop-orchestrator`).
3. Run the prober:

   ```bash
   node scripts/probe-ac-tests.mjs <ac-evidence.json> --baseline <ref> --out .agent-runs/<run-id>/test-gate.json
   ```

   The script isolates every test run inside a throwaway `git worktree` checked out at `--baseline`. It never touches the main working tree, and it removes the worktree before exiting even on failure. Do not attempt to reproduce this by stashing or hard-resetting the main tree — the worktree is what makes running "delete the change and see if it still passes" safe.

4. If the script cannot find a test command for an AC (no `proof[].type: "command"` entry, or its `ref` does not match a `validation.commands[].artifact`), it records that AC as `not-run` with an explanation. Supply an explicit mapping instead of guessing:

   ```bash
   node scripts/probe-ac-tests.mjs <ac-evidence.json> --baseline <ref> --map ac-to-command.json --out .agent-runs/<run-id>/test-gate.json
   ```

   where `ac-to-command.json` is `{"AC-001": "yarn test test/foo.test.ts"}`.

5. Read the probe output. For every `acProbes` entry, judge whether the test is real or mocked past the change:
   - Read the test file the command runs. If the AC describes cross-module, I/O, network, database, or filesystem behavior and the test mocks that boundary, mark it in `mockBoundary` as `"mocked"` or `"partial"` and explain what real behavior is unverified.
   - Mark `"real"` only when the test exercises the actual code path the AC describes, not a stand-in.
   - This step is judgment, not a script: a generic coverage-diff-to-changed-lines check was considered and deliberately left unscripted, because coverage tooling is not uniform across languages and runners and this skill must work in any repository. If a coverage tool is already configured in the project, running it and cross-referencing changed lines is a reasonable manual addition, but it is not required.
6. Set `residualRisk: true` if any `mockBoundary` entry is not `"real"`, or if material AC coverage could not be probed at all.
7. Write the final `test-gate.json` using `references/test-gate-template.json`, merging the probe's `acProbes` with your `mockBoundary` judgments.
8. Validate:

   ```bash
   node scripts/check-test-gate.mjs --test-gate .agent-runs/<run-id>/test-gate.json
   ```

   If the checker reports `GATE_MISMATCH`, fix the `gate` field to match the computed value and rerun; the checker's computed gate is the source of truth.

## Gate Semantics

- `blocked`: at least one AC probe has `verdict: "vacuous"` (the test passed against the baseline) or the report fails structural validation.
- `ready_with_concerns`: no vacuous test, but at least one probe is `"unknown"`/`"not-run"`/`"error"`, or `mockBoundary` shows non-`"real"` coverage, or `residualRisk` is true.
- `ready`: every probed AC falsifies correctly against the baseline and no mock-boundary concern was recorded.

A `blocked` gate here routes back to `maker`, not to `review-diff`. A vacuous test means the MakerAgent needs to write a test that actually pins the behavior; it is not a correctness question for the reviewer to answer.

## Core Rules

- Never run the probe against the main working tree. Always use the isolated worktree the script creates; never `git checkout`, `git stash`, or `git reset` the main tree to "temporarily" go back to baseline.
- Treat `ac-evidence.json`'s self-reported `status: "pass"` as a claim, not proof, until the matching probe falsifies correctly.
- Do not weaken or rewrite the AC's test to make it pass this gate. If a test needs to change, that is `maker`'s job in response to a `blocked` gate, not this skill's.
- Only probe ACs at `status: "pass"`. ACs that are `blocked`, `not-automatable`, or `deferred` have no code proof to falsify and are out of scope for this gate.

## Machine Artifacts

When used by `auto-loop-orchestrator`, produce `test-gate.json` using `references/test-gate-template.json`; the checker validates that JSON directly and does not create a second result file.

## Scripts

- `scripts/probe-ac-tests.mjs <ac-evidence.json> --baseline <ref> [--repo-root <dir>] [--map <file>] [--out <file>]`: run each `status: "pass"` AC's mapped test command inside an isolated git worktree at the baseline ref and record whether it falsifies or is vacuous.
- `scripts/check-test-gate.mjs --test-gate <file>`: validate `test-gate.json` structure and recompute the gate from its contents.

Run scripts with Node.js. They have no package dependencies beyond `git` being available on `PATH`.
