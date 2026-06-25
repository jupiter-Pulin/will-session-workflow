# Tech Spec Template

Use this template for `docs/features/<feature>/2-tech-spec.md`. Keep the document as the main development entry: an AI with little context should know what to build, what not to build, what contract to preserve, and how to judge completion.

Delete sections that genuinely do not apply. Do not delete `Summary`, `Goals`, `Non-goals`, `Contract`, `Acceptance Criteria`, or `Verification Plan` unless the user explicitly asks for a different format.

````markdown
# Tech Spec: <Feature Name>

## Summary

<One paragraph: what changes, who/what it serves, and why now.>

## Context

<Describe current behavior and the relevant code/data flow. Include concrete files, functions, routes, upstream services, cache keys, DB collections, or client dependencies after inspecting the repo.>

## Goals

- MUST <observable outcome>
- MUST <observable outcome>
- SHOULD <preferred outcome if applicable>

## Non-goals

- <Explicitly out of scope>
- <Existing behavior that must not be redesigned>

## Contract

### Core Invariants

List only constraints that must remain true across implementation paths. Do not repeat `Goals`. Prefer 2-5 bullets, and delete this subsection when no cross-path contract applies.

- <Response shape / data meaning / compatibility / cache / error / consistency invariant>
- <Invariant>

### API / Entry Points

| Endpoint / Function | Change | Notes |
| --- | --- | --- |
| `<route or function>` | `<add/modify/remove/no change>` | `<versioning, callers, or compatibility notes>` |

### Request

```jsonc
{
  "<field>": "<type and meaning>"
}
```

### Response

```jsonc
{
  "<field>": "<type, meaning, nullable/optional/default behavior>"
}
```

### Data / Cache / External Services

- Data source: `<DB collection / upstream / config / none>`
- Cache behavior: `<key, TTL, invalidation, locale boundary, stale behavior>`
- Error behavior: `<when upstream fails, returns empty, throws, falls back, logs>`

### Compatibility

- Old clients: `<unchanged / guarded by version / migration required>`
- Existing fields: `<unchanged semantics / deprecated / removed>`
- Rollout or migration: `<none / config flag / data backfill / cache clear>`

## Acceptance Criteria

Every acceptance criterion must have a stable ID in `AC-001` format. Keep the ID stable after Maker work starts; add new ACs with new IDs instead of renumbering existing ones.

- [ ] AC-001: Given `<input/state>`, when `<action>`, then `<observable result>`.
- [ ] AC-002: `<Specific edge/failure case>` returns `<expected behavior>` and does not `<bad behavior>`.
- [ ] AC-003: Existing behavior `<important invariant>` remains unchanged.
- [ ] AC-004: Backward compatibility is preserved for `<versions/callers/fields>`.
- [ ] AC-005: Tests cover `<critical branch>` with assertions that would fail if `<likely regression>` happens.

## Implementation Notes

| Area | Files | Notes |
| --- | --- | --- |
| Controller / API | `<path>` | `<route/DTO/version notes>` |
| Service logic | `<path>` | `<helpers to reuse, logic boundaries>` |
| Types / DTO | `<path>` | `<contract changes>` |
| Tests | `<path>` | `<unit/integration targets>` |

Use existing project patterns before adding new abstractions. Call out anything that must not be changed.

## Edge Cases

| Case | Expected Behavior |
| --- | --- |
| Empty data | `<behavior>` |
| Upstream timeout/error | `<behavior>` |
| Unknown or invalid input | `<behavior>` |
| Cached response | `<behavior>` |
| Old client/version | `<behavior>` |

## Verification Plan

Describe how to prove the acceptance criteria:

- Unit tests: `<files and behavior; AC-001, AC-002>`
- Integration tests: `<routes/services and behavior; AC-003>`
- Manual check, if useful: `<curl or scenario; AC-004>`
- Review/static checks, if required: `<lint/build/precommit/review; AC-005>`

Useful commands should be project-specific and short:

```bash
yarn test <test-file>
```

## Open Questions

| Question | Default Decision | Impact |
| --- | --- | --- |
| `<unknown>` | `<safe default>` | `<what changes if answered differently>` |
````

## Acceptance Criteria Guidance

Strong AC uses a stable ID plus precise inputs, states, and outputs:

```markdown
- [ ] AC-001: When OKX returns `code !== '0'`, the API returns `[]`, logs a warning, and does not throw a 500.
- [ ] AC-002: For app versions `< 6.2.0`, only the 24h field is overridden; 5m/1h/4h fields keep the existing fallback behavior.
- [ ] AC-003: A cached response does not freeze request-locale-specific text; localization happens after the cache boundary.
```

Weak AC should be rewritten:

```markdown
- [ ] Works correctly.
- [ ] AC-001
- [ ] AC-002: Add tests.
- [ ] AC-003: Handle errors.
```

## Verification Guidance

Verification is secondary to AC. Include commands when they are project-specific, non-obvious, or prevent common mistakes. Do not rely on commands alone; each command should map back to one or more stable acceptance-criteria IDs.
