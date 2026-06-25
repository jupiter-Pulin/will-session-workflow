---
name: review-diff
description: Correctness-focused code review for current git diffs, staged changes, branch diffs, or PR patches. Use when asked to independently review code changes for bugs, regressions, broken invariants, acceptance-criteria coverage, API/data contract drift, security or performance correctness risks, missing critical tests, or merge readiness. Prefer fresh subagent context when reviewing MakerAgent output. Not for style-only cleanup, de-AI simplification, or duplicate-utility hunting; use refine-diff for that quality pass.
---

# Review Diff

## Overview

Review the diff as a senior engineer looking for real behavior risk. Prefer a small number of evidence-backed findings over broad commentary.

This skill is adapted from the stronger parts of `code-review`: independent project research, deliberate false-positive checks, severity-grouped findings, optional acceptance-criteria coverage, and a clear merge gate. It intentionally omits environment-specific MCP, hook, and auto-loop mechanics so it works in any repository.

When used in an AI development loop, run this as an independent Reviewer SubAgent when possible. Do not import the MakerAgent conversation history. Use the spec, AC, diff, Request Log, repository files, and validation output as the review record.

## Workflow

1. Establish scope.
   - Run `git status --short`.
   - For a working-tree review, inspect `git diff HEAD --stat` and `git diff HEAD`.
   - For staged-only review, inspect `git diff --cached --stat` and `git diff --cached`.
   - For branch review, identify the base branch from the user request or repository convention, then inspect `git diff <base>...HEAD --stat`, `git diff <base>...HEAD`, and `git log <base>..HEAD --oneline`.
   - Include untracked files from `git status --short` if they are part of the requested change.

2. Load local guidance before judging.
   - Read repository instructions such as `AGENTS.md`, `README*`, package/test config, and nearby module docs when present.
   - Respect language, framework, testing, and review conventions already used by the repository.

3. Load task evidence.
   - Read the tech spec, acceptance criteria, ticket, request doc, or feature doc when provided.
   - Read the MakerAgent Request Log when provided, but treat it as evidence rather than truth.
   - Verify Request Log claims against the diff, tests, code, and command output.

4. Read enough code to understand the changed behavior.
   - Read changed files around the modified lines.
   - Trace callers, callees, data models, DTOs/schemas, route handlers, jobs, migrations, feature flags, and tests touched by the change.
   - Use `rg` to find existing call sites and related behavior.

5. Reconstruct the invariants.
   - Inputs and outputs: accepted shapes, required fields, defaults, nullability, ordering, pagination, units, precision, and serialization.
   - Side effects: database writes, cache keys/TTLs, queue messages, external calls, logs, telemetry, file writes, and retries.
   - Control flow: auth, permissions, rate limits, idempotency, concurrency, transactions, cancellation, and error propagation.
   - Compatibility: public APIs, SDK contracts, migrations, persisted data, config/env behavior, and backwards compatibility.

6. Check specs when available.
   - If the user provides acceptance criteria, a ticket, a request doc, or a spec file, compare the diff against it.
   - If the repository has obvious request/spec docs for the active feature, read the latest relevant one.
   - Keep spec coverage separate from bug findings.

7. Review tests and validation.
   - Identify whether changed behavior has direct tests or strong existing coverage.
   - Recommend focused tests for real risk. Do not demand tests for every line.
   - Run tests only when the user asked for a full verification pass or when local context makes the command obvious and cheap.

## Finding Bar

Report a finding only if it survives all checks:

- Evidence: specific changed code and surrounding context prove the risk.
- Trigger: a concrete input, state, timing, or dependency failure can exercise it.
- Impact: the observed behavior would be wrong, unsafe, incompatible, or materially risky.
- Context: nearby code, tests, docs, and existing project conventions do not already explain it as intentional.
- Minimal fix: there is a clear way to correct the issue without redesigning unrelated code.

Do not report:

- Pure style, naming, formatting, or personal preference.
- "Could be cleaner" observations; those belong to `refine-diff`.
- Hypothetical future extensibility issues without a current failure mode.
- Missing tests unless the gap hides a meaningful regression risk.
- Findings based only on the diff without reading enough surrounding context.

## Severity

- P0: data loss, exploitable security vulnerability, system-wide outage, irreversible corruption, or release-blocking crash.
- P1: likely functional regression, broken public contract, serious performance regression, incorrect authorization, or high-impact production failure.
- P2: real but non-blocking behavior risk, edge-case regression, important missing validation, important missing test coverage, or maintainability issue that directly obscures correctness.
- Nit: minor issue only when the user explicitly wants nits. Otherwise omit.

Gate:

- Blocked: any P0 or P1.
- Ready with concerns: no P0/P1, but there are P2 findings or important test gaps.
- Ready: no material findings.

## Output

Lead with findings. Keep summary secondary.

Use this shape:

```markdown
## Findings

### P0
- [file:line] Title
  Impact: what breaks.
  Trigger: exact condition that exposes it.
  Evidence: why the code proves it.
  Fix: smallest safe correction.

### P1
- ...

### P2
- ...

## AC Coverage
| AC | Status | Evidence |
|----|--------|----------|

## Tests
- Tests run: command or "not run".
- Suggested tests: focused cases only.

## Gate
Blocked / Ready with concerns / Ready
```

If there are no findings, say that clearly and name residual risk, especially unrun tests or unread external systems.

## Coordination

Run this before `refine-diff` when both correctness and simplification are requested. Correctness findings should not be diluted by style or elegance feedback.

In a Maker/Reviewer loop:

- Return a report to the MakerAgent; do not patch files unless the user explicitly asks.
- Keep the review record independent from MakerAgent reasoning.
- If the diff becomes review-green and later receives refinement changes, use `post-refine-check` for the final regression gate instead of rerunning this full review as another design pass.

## Machine Artifacts

When used by `auto-loop-orchestrator`, produce `review-diff.json` using `references/review-diff-template.json`; the checker validates that JSON directly and does not create a second result file.

## Scripts

- `scripts/check-review-diff.mjs --review <file>`: validate `review-diff.json`.
