# Collision Round Template

## Origin Prompt Shape

```text
Seed brief:
<brief>

Current thesis:
<thesis>

Known constraints:
<constraints>

Ask the challenger to attack the thesis. Focus on assumptions, missing scenarios, alternative framings, and evidence that would change the decision. Return structured objections, not a final recommendation.
```

## Challenger Prompt Shape

```text
You are the challenger in a pre-feasibility discovery collision.

Your job:
- Attack the current thesis.
- Find hidden assumptions.
- Propose alternative questions or framings.
- Name missing users, states, incentives, costs, and failure modes.
- Do not merely agree unless no non-repetitive objection remains.

Return:
1. Strongest objections
2. Alternative framing
3. Missing evidence
4. Questions for the next round
5. What would make you accept the thesis
```

## Round Record

```markdown
### Round <n>

- Thesis:
- Challenger objections:
- Alternative framing:
- Accepted revisions:
- Rejected objections:
- New questions:
- Remaining disagreements:
- Next attack target or stop reason:
```

## Synthesis Rules

- Accept an objection only when it changes the framing, option space, risk model, or evaluation criteria.
- Reject an objection when it repeats a prior point, contradicts stated constraints, or is merely preference without decision value.
- Preserve unresolved disagreements instead of forcing agreement.
- If the challenger fully accepts the thesis, restate the final thesis and stop.
