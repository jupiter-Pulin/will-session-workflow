---
name: ai-discovery-collision
description: Run pre-feasibility discovery through structured adversarial exploration. Use when the user wants to brainstorm, challenge assumptions, collide viewpoints, explore multiple possible framings, or produce a discovery memo before requirements, feasibility, or tech-spec work.
---

# AI Discovery Collision

Use this skill before feasibility, requirements, or tech-spec writing when the problem is still too narrow, too assumed, or too solution-shaped. The output is a discovery memo that opens the option space; it is not a final decision and not an implementation contract.

## Workflow

1. Capture the seed brief: user goal, known constraints, suspected solution, and unknowns.
2. Read `references/discovery-loop.md`.
3. Run the origin/challenger collision loop. Use subagents for challenger passes when available; otherwise use the documented single-agent fallback.
4. Keep every round structured. Do not let the exchange become an untracked conversation.
5. Read `references/discovery-memo-template.md` before writing the final memo.
6. Write `docs/features/<feature>/-1-discovery.md` when the repo has a matching feature-doc convention. Otherwise write the memo in the user-requested location or return it directly.

## Core Rules

- Preserve divergence until the stop condition is met. Do not collapse into a preferred solution too early.
- Challenge assumptions, problem framing, user segmentation, risks, incentives, lifecycle costs, and hidden constraints.
- Separate accepted revisions from unresolved disagreements.
- Treat discovery output as input to later feasibility or requirements work, not as authority for implementation.
- If later using `ai-tech-spec`, pass the discovery memo as context for `0-feasibility-study.md` or `1-requirements.md`.

## Reference Loading

- Collision loop, roles, round policy, and stop conditions: read `references/discovery-loop.md`.
- Final memo structure: read `references/discovery-memo-template.md`.
- Per-round note format and reusable prompts: read `references/collision-round-template.md` when running multi-round discovery or subagent challenges.
