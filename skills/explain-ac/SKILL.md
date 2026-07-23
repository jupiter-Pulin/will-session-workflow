---
name: explain-ac
description: Walk a human gatekeeper through a spec's acceptance criteria with a fixed accident-first frame (what accident it prevents / which Goal or Invariant loses teeth if removed / what concrete value the human can veto or adjust), enforcing comprehension checks and a final keep/veto/adjust verdict ledger before approval. Use when the user says they cannot understand a tech spec or its ACs, asks to explain acceptance criteria, wants coaching before approving a spec ("看不懂 AC", "帮我过一遍 spec", "这条 AC 是干嘛的", "approve 前给我讲讲"). Not for authoring or restructuring specs (use ai-tech-spec) and not for reviewing code diffs (use review-diff).
---

# Explain AC

Use this skill to turn "AI explains the spec" from a passive lecture into a comprehension-gated approval session. The user's goal is not to hear the ACs restated — it is to be able to responsibly approve, veto, or adjust each one.

## Scope

Use this skill for:

- Explaining acceptance criteria (or invariants) of a tech spec / requirements doc to a human gatekeeper.
- Coaching a user who must approve a spec they do not fully understand.

Do not use this skill for:

- Writing or fixing the spec itself (`ai-tech-spec`).
- Judging whether an implementation satisfies ACs (verifier/review workflows).

## Workflow

1. Locate the spec: use the path given in arguments; otherwise the most recently modified `docs/features/*/2-tech-spec.md` (or any AC-bearing doc the user points at). If multiple candidates are plausible, ask one short question.
2. Read the spec fully. Extract: AC list (with IDs), Goals, Non-goals, Core Invariants. Build a private AC→Goal/Invariant mapping before explaining anything.
3. Explain in batches of 3–5 ACs per turn, in spec order. For each AC, deliver exactly the three-part frame below.
4. End every batch with a comprehension check (see below). Do not continue to the next batch until the user engages.
5. Track verdicts as they come. After the last batch, output the verdict ledger and state plainly whether the user is ready to approve.

## The three-part frame (per AC)

1. **事故 (accident)**: what concretely goes wrong someday if this AC is absent. Phrase as "如果没有它,某天会发生:…". Plain language; forbidden to restate the AC in different jargon. If the accident needs a scenario, give one with real components from the spec's Context.
2. **牙齿 (teeth)**: which Goal or Core Invariant becomes unenforceable if this AC is deleted. Name it verbatim from the spec.
3. **可表态点 (decidable)**: the specific number, threshold, default, or tradeoff inside this AC that the human has authority to change. If the AC is pure hardening with no tradeoff, write "无 — 纯加固".

If an AC cannot be phrased as a preventable accident, say so explicitly: that is a weak AC and a spec finding — recommend fixing the spec rather than papering over it with explanation.

## Comprehension check protocol

- After each batch, ask the user to restate ONE accident from the batch in their own words, or to give keep/veto/adjust verdicts for the batch.
- If the restatement misses the point, re-explain that single AC differently (new scenario, smaller words). Do not move on.
- Depth is adaptive: spend the most time on the 1–2 subtlest ACs per batch (failure-attribution rules, crash windows, tradeoff pairs); pass quickly over pure-hardening ones.

## Verdict ledger

Finish the session with a table: `AC-id | 一句话事故 | verdict (keep / veto / adjust + new value) | open item`. State the approval rule explicitly: the user is ready to approve only when every row is keep or resolved-adjust, and every veto has been fed back into the spec.

## Guardrails

- Never write an explainer file, companion doc, or annotated spec copy. Explanation lives in the conversation only — a written explainer becomes a competing source of truth against the spec.
- Quote AC IDs verbatim; never renumber or paraphrase IDs.
- Speak the user's language (match the spec/user; typically Chinese here), but keep AC IDs and code identifiers as-is.
- Do not soften findings: if two ACs contradict, or an AC is untestable, surface it immediately as a spec defect.

## Output

Finish with:

- The verdict ledger (all ACs, all verdicts, open items).
- Explicit statement: ready to approve / not ready, and what blocks it.
- Any spec defects found while explaining (weak ACs, contradictions), phrased as feedback for the spec author.
