---
name: ai-tech-spec
description: Create, review, or improve AI-friendly feature documentation for software work, especially feasibility studies, product requirements, tech specs, implementation plans, and request/progress logs. Use when Claude is asked to write a tech spec, design a feature doc structure, harden acceptance criteria, split feature docs by phase, or make a spec usable by an AI with little project context.
---

# AI Tech Spec

Use this skill to produce feature documentation that another AI or engineer can develop from with low context. Prefer one workflow skill with phase-specific references over separate skills for feasibility, requirements, tech spec, implementation plan, and request logs.

## Document Set

Choose the smallest document set that fits the request:

| Change size | Documents |
| --- | --- |
| Small | `docs/features/<feature>/2-tech-spec.md` |
| Medium | `docs/features/<feature>/2-tech-spec.md` plus `docs/features/<feature>/requests/YYYY-MM-DD-<task>.md` |
| Complex | `0-feasibility-study.md`, `1-requirements.md`, `2-tech-spec.md`, optional `4-implementation-plan.md`, and `requests/*` |

Treat this table as the scope of work for documentation. `4-implementation-plan.md` is optional: create it only when sequencing, file ownership, staged rollout, or review coordination would otherwise be unclear.

Keep `2-tech-spec.md` as the main development entry. Request logs may track progress and outcomes, but they must not become the only source of requirements.

## Phase Responsibilities

| File | Purpose |
| --- | --- |
| `0-feasibility-study.md` | Decide whether the work is feasible, compare options, identify costs and risks. |
| `1-requirements.md` | Capture product scenarios, business rules, user-visible behavior, and product decisions. |
| `2-tech-spec.md` | Define the engineering contract, acceptance criteria, edge cases, compatibility, and verification plan. |
| `4-implementation-plan.md` | Break the work into file-level tasks and an execution order when the implementation is non-trivial. |
| `requests/*.md` | Record a concrete development pass: scope, progress, changed files, verification results, review state, and remaining work. |

## Core Rules

- Treat feasibility studies as decision memos, not implementation reports. Keep options in one comparison table and move detailed implementation risks to the tech spec.
- Make `Acceptance Criteria` the strongest part of the spec. Write observable behavior, not vague intent.
- Include `Non-goals` to prevent scope expansion.
- Include the API, data, cache, error, compatibility, and migration contract when the change touches them.
- Include `Core Invariants` inside `Contract` when response semantics, compatibility, cache, error, data consistency, or cross-path behavior must not drift.
- Prefer concrete paths, existing functions, route names, DTO names, and test files after inspecting the repo.
- Keep verification supportive: describe how to prove AC, but do not let command lists replace AC.
- Separate proposal from as-built status. Use request logs for progress, test results, and review outcomes.
- Do not split documents just to look formal. Split only when the content has different ownership or lifecycle.

## Reference Loading

Load only the reference needed for the current task:

- Feasibility study or option analysis: read `references/templates/feasibility-study.md`.
- Product requirements or business rules: read `references/templates/requirements.md`.
- Tech spec creation or review: read `references/templates/tech-spec.md`.
- File-level development sequencing: read `references/templates/implementation-plan.md`.
- Concrete progress, implementation pass, or test pass tracking: read `references/templates/request-log.md`.

When creating multiple documents, read only the templates for the requested phases. Keep cross-links between documents relative and concise.

## Scripts

- `scripts/build-task-pack.mjs <feature-dir|2-tech-spec.md> [--out <file>] [--format json|md]`: build a Maker-facing task pack from a feature path. The feature name is derived from the path, for example `docs/features/market-price-alert/2-tech-spec.md` becomes `market-price-alert`. The gate only blocks on missing tech spec or invalid Acceptance Criteria structure; broader spec quality concerns should be handled by a separate review.
