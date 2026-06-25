# Feasibility Study Template

Use this template for `docs/features/<feature>/0-feasibility-study.md` when the team needs to decide whether a feature or technical direction is worth pursuing. Write it as a decision memo, not a full design document.

Target length: 80-120 lines for most features. If it grows longer, move details into `2-tech-spec.md`, an appendix, or source links.

````markdown
# Feasibility Study: <Feature / Problem>

## Engineer Reading Guide

If you are implementing this feature, read `Summary`, `Recommendation`, `Validation Plan`, and `Open Questions`, then use `./2-tech-spec.md` as the implementation source of truth.

Read the option comparison only when revisiting the chosen approach.

## Summary

<One paragraph: what decision this study enables, which option is recommended, and why.>

## Decision Needed

| Question | Why It Matters | Default / Owner |
| --- | --- | --- |
| `<decision>` | `<impact>` | `<default or owner>` |

## Background

<Short context only: current pain, why this is uncertain, and why a decision is needed before writing or approving the tech spec. Avoid implementation detail.>

## Evidence Checked

| Area | Finding | Source |
| --- | --- | --- |
| Code / current flow | `<finding>` | `<path/function/command>` |
| Data / traffic / cost | `<finding>` | `<dashboard/log/query/sample>` |
| Upstream / external | `<finding>` | `<docs/curl/sample>` |
| Product / user impact | `<finding>` | `<Jira/product note/support issue>` |

## Constraints

| Constraint | Detail | Hard / Soft |
| --- | --- | --- |
| Compatibility | `<old clients, existing API fields, migration limit>` | `<hard/soft>` |
| Cost / latency | `<budget, rate limit, timeout, billing model>` | `<hard/soft>` |
| Data quality | `<source freshness/completeness>` | `<hard/soft>` |
| Operations | `<rollout, maintenance, observability limit>` | `<hard/soft>` |

## Option Comparison

Use one table. Keep each cell short. Do not add separate subsections for every option unless the decision is unusually complex.

| Option | Description | Pros | Cons / Risks | Unknowns | Verdict |
| --- | --- | --- | --- | --- | --- |
| A: `<name>` | `<short description>` | `<main benefits>` | `<main tradeoffs>` | `<unknowns>` | `<reject/consider/recommend>` |
| B: `<name>` | `<short description>` | `<main benefits>` | `<main tradeoffs>` | `<unknowns>` | `<reject/consider/recommend>` |
| C: `<name>` | `<short description>` | `<main benefits>` | `<main tradeoffs>` | `<unknowns>` | `<reject/consider/recommend>` |

## Recommendation

Recommend **<Option>**.

Reasons:

- `<reason tied to evidence>`
- `<reason tied to constraints>`
- `<reason tied to cost/risk>`

## Decision Risks

Only include risks that could change the recommended option or require product/backend agreement. Put implementation risks, edge cases, and test risks in `2-tech-spec.md`.

| Risk | Why It Matters | Mitigation / Decision |
| --- | --- | --- |
| `<decision-level risk>` | `<impact>` | `<mitigation or default>` |

## Validation Plan

What must be checked before implementation starts or before the tech spec is considered stable:

- [ ] `<curl/query/code-read/benchmark/product confirmation>`
- [ ] `<data sample or upstream behavior>`
- [ ] `<compatibility confirmation>`

## Follow-up Documents

- Requirements: `<./1-requirements.md or not needed>`
- Tech spec: `<./2-tech-spec.md>`
- Implementation plan: `<./4-implementation-plan.md or not needed>`

## Open Questions

| Question | Default If Unanswered | Impact |
| --- | --- | --- |
| `<unknown>` | `<safe default>` | `<what changes>` |
````

## Senior Review Guidance

A strong feasibility study makes a decision cheaper. It should answer: what was checked, what options were considered, which option is recommended, what remains unknown, and what must be validated next.

Common over-writing signals:

- Option A/B/C/D each has its own long subsection.
- Risks repeat the tech spec edge cases or implementation AC.
- The document explains schemas, DTOs, jobs, or file-level implementation.
- Engineers must read the whole document before coding.
