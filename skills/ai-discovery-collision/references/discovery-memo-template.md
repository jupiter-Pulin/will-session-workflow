# Discovery Memo Template

Use this template for `docs/features/<feature>/-1-discovery.md` when the repository has feature docs. Otherwise use it in the user-requested location or final answer.

```markdown
# Discovery Memo: <Feature or Problem>

## Seed Brief

<User goal, context, suspected solution, known constraints, and unknowns.>

## Current Best Framing

<The strongest current framing after collision. Include what changed from the initial framing.>

## Explored Possibilities

| Possibility | Why It Matters | Main Risk | When It Wins |
| --- | --- | --- | --- |
| <Option or framing> | <Reason> | <Risk> | <Decision condition> |

## Collision Rounds

### Round 1

- Thesis:
- Challenger objections:
- Accepted revisions:
- Rejected objections:
- Remaining disagreements:
- Next attack target or stop reason:

## Accepted Revisions

- <Assumption or claim that changed because of the collision.>

## Unresolved Disagreements

| Disagreement | Competing Views | What Would Resolve It |
| --- | --- | --- |
| <Issue> | <View A vs View B> | <Evidence, decision, or feasibility analysis> |

## Hidden Assumptions

- <Assumption that later specs should validate or make explicit.>

## Risky But Interesting Paths

- <High-upside path that may be too risky, costly, or uncertain.>

## Feasibility Inputs

### Candidate Options

- <Option to compare in feasibility.>

### Evaluation Criteria

- <Criterion, such as cost, reversibility, user impact, implementation risk, or maintenance burden.>

### Risks To Validate

- <Risk requiring research, prototype, or explicit decision.>

## Recommended Next Step

<Usually: write feasibility study, write requirements, prototype one risk, or ask a product decision question.>
```

Keep the memo concise enough to be read before feasibility. Move raw debate transcripts out unless the user explicitly wants them.
