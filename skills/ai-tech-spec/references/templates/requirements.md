# Requirements Template

Use this template for `docs/features/<feature>/1-requirements.md` when product behavior, business rules, user scenarios, or cross-team decisions need to be captured before the tech spec. This document should explain what must be true from the product perspective, not how the code should be written.

Delete sections that do not apply. Keep product decisions separate from engineering implementation notes.

````markdown
# Requirements: <Feature Name>

## Summary

<One paragraph: user/business problem, target behavior, and intended outcome.>

## Problem

<Describe the current user-visible or business-visible problem. Include examples, affected surfaces, and why existing behavior is insufficient.>

## Users / Consumers

| Consumer | Need | Notes |
| --- | --- | --- |
| `<end user/client/team>` | `<need>` | `<version, platform, workflow>` |

## Goals

- MUST <product outcome>
- MUST <business rule>
- SHOULD <preferred behavior>

## Non-goals

- <Scenario or capability explicitly out of scope>
- <Existing behavior that should not be changed>

## User Scenarios

| Scenario | Given | When | Then |
| --- | --- | --- | --- |
| `<name>` | `<state>` | `<action>` | `<expected product behavior>` |

## Product Rules

| Rule | Priority | Notes |
| --- | --- | --- |
| `<rule>` | `<MUST/SHOULD/MAY>` | `<edge, exception, owner>` |

## Content / Copy / Locale

| Item | Requirement |
| --- | --- |
| Text / label | `<copy source, key, fallback, locale behavior>` |
| Formatting | `<date/time/number/currency/precision>` |
| Empty state | `<what users see>` |
| Error state | `<what users see>` |

## Data Semantics

| Field / Concept | Meaning | Empty / Unknown Behavior |
| --- | --- | --- |
| `<field>` | `<business meaning>` | `<hide, null, --, fallback, disabled>` |

## Compatibility

| Surface | Requirement |
| --- | --- |
| Old clients | `<must keep working / version gate / unsupported>` |
| Existing API fields | `<unchanged / deprecated / replaced>` |
| Existing user workflows | `<unchanged / changed intentionally>` |

## Success Metrics

| Metric | Target | Source |
| --- | --- | --- |
| `<metric>` | `<target>` | `<dashboard/log/event/manual>` |

## Acceptance Criteria

- [ ] Given `<product state>`, when `<user/client action>`, then `<visible result>`.
- [ ] `<Important edge case>` behaves as `<product decision>`.
- [ ] Existing workflow `<name>` remains unchanged for `<users/versions>`.

## Dependencies

| Dependency | Owner | Status | Notes |
| --- | --- | --- | --- |
| `<design/content/data/upstream/client>` | `<owner>` | `<ready/pending/blocked>` | `<notes>` |

## Open Questions

| Question | Default Decision | Impact |
| --- | --- | --- |
| `<unknown>` | `<safe product default>` | `<what changes if answered differently>` |

## Handoff To Tech Spec

The tech spec must resolve:

- `<API/data/cache/compatibility item>`
- `<migration/versioning/rollout item>`
- `<testability or observability item>`
````

## Senior Review Guidance

Good requirements make product intent unambiguous and implementation-independent. If a requirement names code files or helper functions, move that detail to the tech spec unless it is only a reference for context.
