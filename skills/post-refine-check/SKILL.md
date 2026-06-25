---
name: post-refine-check
description: Final read-only regression verification after review-diff has passed and refine-diff changes have been applied. Use as an independent or subagent merge gate to confirm refined code still satisfies acceptance criteria, public contracts, invariants, and the review-green validation baseline. Not for initial correctness review, style cleanup, simplification advice, or implementing fixes.
---

# Post Refine Check

## Overview

Verify that refinement changes did not break already-reviewed behavior. This is a narrow final gate: check acceptance criteria, invariants, contracts, and validation evidence; do not suggest new refactors or improve code style.

## Scope

Use this skill after:

- `review-diff` found no blocking correctness issues.
- `refine-diff` produced simplification or reuse recommendations.
- The MakerAgent applied one or more refinement changes.
- The code is being checked before merge, release, or handoff.

Do not use this skill for:

- First-pass correctness review; use `review-diff`.
- Code elegance, reuse, or simplification review; use `refine-diff`.
- Implementing fixes. Return a report unless the user explicitly asks for patches.
- Creating new behavior or expanding acceptance criteria.

## Operating Rules

- Run with fresh context when possible. Prefer an independent subagent over the MakerAgent conversation.
- Do not rely on MakerAgent chat history. Use only the spec or AC, current diff, review-green baseline, refinement report, request log, repository files, and command outputs.
- Treat the Request Log as evidence, not truth. Verify its claims against code, tests, and command output.
- Preserve the review-green baseline. Prefer rerunning the exact commands that passed before refinement.
- Inspect modified tests carefully. Do not count a passing suite as sufficient if refinement weakened assertions, skipped tests, rewrote snapshots without justification, or changed tests to match broken behavior.
- Report only regression risks, broken AC, broken invariants, invalid validation evidence, or missing verification that materially affects merge confidence.

## Workflow

1. Establish inputs.
   - Run `git status --short`.
   - For a working-tree check, inspect `git diff HEAD --stat` and `git diff HEAD`.
   - For staged-only check, inspect `git diff --cached --stat` and `git diff --cached`.
   - For branch check, identify the base branch from the user request or repository convention, then inspect `git diff <base>...HEAD --stat`, `git diff <base>...HEAD`, and `git log <base>..HEAD --oneline`.
   - If a review-green baseline ref, patch, or report is available, compare final code against that baseline.
   - Read the tech spec, acceptance criteria, review report or pass summary, refinement report, Request Log, and validation commands when provided.
   - If an input is missing, continue with available evidence and record the residual risk.

2. Identify the refinement delta.
   - Focus on changes made after the code became review-green.
   - Prioritize risky surfaces: public APIs, DTOs, schemas, route behavior, persisted data, migrations, cache keys, permissions, auth, error semantics, external calls, queue messages, concurrency, precision, and serialization.
   - Confirm each refinement is behavior-preserving or still explicitly satisfies the AC.

3. Re-check acceptance criteria and invariants.
   - Map each AC to current code or tests.
   - Reconstruct key invariants from the review-green report, spec, and changed code.
   - Mark an AC as unknown rather than passing it from intent alone.

4. Verify commands.
   - Rerun the review-green baseline commands when feasible: tests, lint, typecheck, build, contract checks, or targeted integration checks.
   - Run the smallest obvious additional command for changed high-risk areas when the baseline does not cover them.
   - If a command cannot run, record the exact command and reason.

5. Check test integrity.
   - Review any test changes after refinement.
   - Flag weakened assertions, removed edge cases, changed fixtures that hide regressions, broad snapshot rewrites, skipped tests, or tests that only mirror implementation details.
   - Treat new tests as supporting evidence, not a replacement for unchanged baseline validation.

6. Decide the gate.
   - Blocked: an AC fails, an invariant or contract is broken, a required baseline command fails, or test changes invalidate the verification.
   - Ready with concerns: no proven regression, but important baseline commands or inputs are missing, or a high-risk area lacks meaningful verification.
   - Ready: AC and invariants are still satisfied, relevant commands pass, and no refinement regression is found.

## Output

Use this shape:

```markdown
## Gate
Blocked / Ready with concerns / Ready

## Findings
- [Blocked/Concern] file:line Title
  Impact:
  Evidence:
  Required action:

## AC Regression Check
| AC | Status | Evidence |
|----|--------|----------|

## Validation
- Baseline commands rerun:
- Additional commands:
- Test changes inspected:

## Residual Risk
- Missing inputs, unrun commands, or external systems not verified.
```

If there are no findings, say so plainly and keep the residual risk section short.

## Machine Artifacts

When used by `auto-loop-orchestrator`, produce `post-refine-check.json` using `references/post-refine-check-template.json`; the checker validates that JSON directly and does not create a second result file.

Gate values:

- `ready`: no AC regression, invariant break, baseline validation failure, or material missing verification was found.
- `ready_with_concerns`: no proven regression, but residual risk, unknown AC status, skipped command, or missing test-change inspection remains.
- `blocked`: an AC regressed, an invariant or contract broke, a required command failed, or the report is invalid.

## Scripts

- `scripts/check-post-refine-check.mjs --post-refine <file>`: validate `post-refine-check.json`.
