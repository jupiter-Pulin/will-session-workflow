---
name: refine-diff
description: Review already-correct diffs to simplify AI-generated or over-engineered code while preserving behavior. Use after review-diff is Ready, or when asked to de-AI-ify a diff, remove premature abstractions, reduce duplication, or check reuse of existing helpers/patterns. Not for correctness bugs (use review-diff) or final regression verification (use post-refine-check).
---

# Refine Diff

## Purpose

Review a diff as a maintainer asking whether the code earns its complexity. The goal is clearer intent, less duplication, better reuse of existing project capabilities, and closer alignment with repository idioms.

Preserve behavior, public contracts, side effects, error semantics, observability, performance characteristics, and test intent. This pass is about maintainability payoff, not correctness triage, style preference, or clever minimalism.

## When To Use

Use this skill after correctness has already been reviewed, especially after `review-diff` is Ready or Ready with only accepted concerns.

Use it when a diff may:

- Duplicate existing utilities, framework features, local helpers, or nearby module patterns.
- Add premature abstractions, layers, types, wrappers, or single-use helpers that hide the main flow.
- Over-defend states that cannot be reached because validation, schemas, routing, or upstream contracts already rule them out.
- Make TypeScript, test structure, or decomposition technically tidy while reducing readability.
- Drift from established repository idioms in a way that raises future maintenance cost.

Do not use it for:

- First-pass correctness review; use `review-diff`.
- Final regression verification after refinements are applied; use `post-refine-check`.
- Broad architecture redesign.
- Formatting, naming, or style-only feedback without a real readability or maintenance payoff.

If you find a behavior bug, mention it briefly and recommend `review-diff`; do not let correctness findings dominate this pass.

## Review Method

Establish the reviewed diff first. Inspect `git status --short`, then use the appropriate diff for the request: working tree, staged-only, or branch-to-base. Include untracked files only when they are part of the requested change.

Load only evidence that affects the changed code: repository instructions, nearby module patterns, relevant docs, task specs, review summaries, Request Logs, and validation output. Treat prior logs as evidence, not truth.

Search before judging, guided by what changed:

- For new helpers, exported symbols, services, decorators, validators, hooks, or shared code, search exact names and likely nearby alternatives.
- For DTOs, schemas, routes, cache keys, parsing, mapping, literals, and error messages, compare adjacent domain patterns.
- For tests, distinguish observable behavior checks from implementation mirrors.

Judge each added concept by its payoff:

- Required complexity protects a real invariant, handles a known external contract, supports security or data recovery, preserves precision, manages concurrency, or follows an established project pattern.
- Accidental complexity comes from generated code, copied logic, premature generalization, local over-defense, or missing reuse of repository capabilities.
- Unclear complexity may be worth keeping, but should expose the domain stage or invariant through better locality, naming, tests, or a short comment.

Prefer small local rewrites before new abstractions. Recommend extraction only when it reveals a real business stage, centralizes a hard invariant, or removes meaningful duplication. Recommend inlining when the abstraction hides more than it explains.

By default, report recommendations only. Patch files only when the user explicitly asks; then make focused, behavior-preserving edits and run the smallest relevant validation.

## Output

Always include `Verdict`. Add other sections only when they have useful content.

Use refinement impact, not P0/P1/P2 severity:

- High: materially reduces duplicated logic, removes misleading abstractions, or aligns with an existing project-wide pattern.
- Medium: improves readability, locality, reuse, or test intent in changed code.
- Low: optional polish with modest benefit; omit unless the user asked for thorough cleanup.

Each refinement should include the payoff, repository evidence, suggested change, and why behavior remains safe.

Use this shape:

```markdown
## Verdict
<1-3 sentences: keep as-is / refine a few spots / too much accidental complexity.>

## Refinement Opportunities
- [High/Medium/Low] file:line Title
  Payoff:
  Evidence:
  Suggestion:
  Safety:

## Keep
- [file:line] Optional: complexity that is justified and should not be simplified.

## Reuse Candidates
- Optional: existing helper/module/test pattern that can replace or guide multiple findings.

## Not Worth Changing
- Optional: consciously deferred cleanup where benefit is low or risk is high.
```

If no worthwhile refinements exist, say so plainly and omit empty sections.

## Machine Artifacts

When used by `auto-loop-orchestrator`, produce `refine-diff.json` using `references/refine-diff-template.json`; the checker validates that JSON directly and does not create a second result file.

Gate values:

- `no_changes`: no worthwhile behavior-preserving refinement is recommended.
- `changes_required`: one or more refinement opportunities should be applied by `refine-apply`.
- `blocked`: the refinement report is invalid or cannot safely proceed, usually because the diff needs another correctness review first.

## Scripts

- `scripts/check-refine-diff.mjs --refine <file>`: validate `refine-diff.json`.
