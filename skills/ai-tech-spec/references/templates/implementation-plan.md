# Implementation Plan Template

Use this optional template for `docs/features/<feature>/4-implementation-plan.md` when the implementation is large enough to need sequencing beyond the tech spec. Create it only when file ownership, staged rollout, dependency ordering, or review coordination would otherwise be unclear. This document should guide execution while keeping `2-tech-spec.md` as the source of truth for contract and acceptance criteria.

Delete sections that do not apply. Prefer chunks that can be implemented and verified independently.

````markdown
# Implementation Plan: <Feature Name>

## Summary

<One paragraph: implementation strategy, major modules touched, and sequencing principle.>

## Source Of Truth

- Requirements: `<./1-requirements.md or not applicable>`
- Tech spec: `<./2-tech-spec.md>`
- Feasibility study: `<./0-feasibility-study.md or not applicable>`

If this plan conflicts with `2-tech-spec.md`, update the tech spec first or call out the discrepancy before coding.

## Preconditions

| Item | Status | Notes |
| --- | --- | --- |
| Product decisions finalized | `<yes/no>` | `<open items>` |
| API/data contract stable | `<yes/no>` | `<open items>` |
| Test fixtures available | `<yes/no>` | `<needed fixtures>` |
| External dependency verified | `<yes/no/not needed>` | `<curl/sample/docs>` |

## Change Map

| Area | Files | Change Type | Notes |
| --- | --- | --- | --- |
| Controller / API | `<path>` | `<add/modify>` | `<route/version/DTO>` |
| Service logic | `<path>` | `<add/modify>` | `<main behavior>` |
| Types / DTO | `<path>` | `<add/modify>` | `<contract>` |
| Config / cache | `<path>` | `<add/modify>` | `<keys/TTL/invalidation>` |
| Tests | `<path>` | `<add/modify>` | `<coverage>` |
| Docs | `<path>` | `<add/modify>` | `<updates>` |

## Execution Chunks

### Chunk 1: <Name>

Goal: <small, independently reviewable outcome>.

Files:

- `<path>` - `<change>`

Steps:

- [ ] `<step>`
- [ ] `<step>`

Verification:

- [ ] `<unit/build/manual check tied to AC>`

Rollback / Safety:

- `<how to revert or why safe>`

### Chunk 2: <Name>

Goal: <small, independently reviewable outcome>.

Files:

- `<path>` - `<change>`

Steps:

- [ ] `<step>`
- [ ] `<step>`

Verification:

- [ ] `<unit/build/manual check tied to AC>`

Rollback / Safety:

- `<how to revert or why safe>`

## Testing Plan

| Layer | Files / Command | Acceptance Criteria Covered |
| --- | --- | --- |
| Unit | `<test file>` | `<AC ids or behavior>` |
| Integration | `<test file>` | `<AC ids or behavior>` |
| Manual | `<curl/scenario>` | `<AC ids or behavior>` |
| Static | `<lint/build/precommit>` | `<what it proves>` |

## Risk Controls

| Risk | Control |
| --- | --- |
| Scope creep | `<non-goals, file boundaries>` |
| Contract drift | `<type tests, response snapshots, client reference>` |
| Cache/migration issue | `<cache clear, version gate, fallback>` |
| Upstream instability | `<mock, fallback, timeout behavior>` |

## Review Checklist

- [ ] Changes match `2-tech-spec.md` contract.
- [ ] Each AC has either automated coverage or an explicit manual verification path.
- [ ] No unrelated refactors are included.
- [ ] Old clients / existing callers are protected.
- [ ] Logs, metrics, or warnings are sufficient for expected failure modes.

## Open Implementation Questions

| Question | Proposed Default | Impact |
| --- | --- | --- |
| `<implementation unknown>` | `<default>` | `<impact>` |
````

## Senior Review Guidance

A good implementation plan reduces coordination risk. It should not duplicate every line of the tech spec; it should explain sequencing, file boundaries, verification per chunk, and rollback safety.
