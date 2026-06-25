# Discovery Loop

## Purpose

Use this loop to widen the problem space before feasibility or requirements work. The goal is not to win a debate. The goal is to expose better questions, stronger options, hidden assumptions, risks, and unresolved tradeoffs.

## Roles

- Origin agent: frames the problem, names assumptions, proposes the current best thesis, and integrates valid objections.
- Challenger agent: attacks the current thesis, finds missing scenarios, proposes alternative framings, and asks sharper questions.
- Synthesizer: usually the origin agent after each challenger pass. It records what changed, what remains disputed, and what the next round should attack.

If subagent tools are available, use a subagent for challenger passes. Give it the seed brief, current thesis, prior round summary, and the exact challenge objective. Do not leak the desired answer. If subagents are unavailable, run a single-agent fallback with clearly separated `Origin`, `Challenger`, and `Synthesis` sections.

## Loop

1. Seed brief
   - Restate the user's goal.
   - List known constraints.
   - List the suspected solution, if any.
   - List the most important unknowns.

2. Origin framing
   - State the current best framing.
   - Name the obvious solution paths.
   - Name the assumptions that must be true.
   - Name the first evaluation criteria.

3. Challenger attack
   - Attack assumptions.
   - Find missing users, states, incentives, edge cases, costs, and failure modes.
   - Propose at least one alternative framing or question.
   - Identify what evidence would change the decision.

4. Synthesis
   - Accept strong objections and revise the thesis.
   - Reject weak objections with reasons.
   - Preserve unresolved disagreements.
   - Choose the next attack target.

5. Continue or stop
   - Continue while new, material objections are appearing.
   - Stop when the stop conditions below are met.

6. Write the discovery memo
   - Use `discovery-memo-template.md`.
   - Keep the memo useful for feasibility or requirements work.

## Default Round Policy

- Run at least 2 rounds for meaningful discovery.
- Stop after 4 rounds unless the user explicitly asks to continue.
- Stop early only when the latest thesis is restated and no non-repetitive objection remains.

## Stop Conditions

Stop when one or more conditions apply:

- Two consecutive rounds produce no materially new objection.
- The remaining disagreement is a value tradeoff suitable for feasibility.
- One side fully accepts the revised framing and cannot produce a non-repetitive objection.
- The round cap is reached.
- The user asked for a time-boxed or lightweight discovery pass.

## Quality Bar

A good discovery pass contains surprising alternatives, not just a list of pros and cons. It should make later feasibility easier by handing it sharper options, risks, and evaluation criteria.
