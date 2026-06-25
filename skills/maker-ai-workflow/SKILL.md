---
name: maker-ai-workflow
description: Guide Maker AI implementation from approved specs and acceptance criteria. Use when an AI must implement from a tech spec, requirements document, frozen task spec, or AC list; produce AC traceability, tests, request logs, and concrete completion evidence.
---

# Maker AI Workflow

Use this skill when the task has an implementation contract and the AI must prove completion against acceptance criteria. Maker completion means every AC is satisfied with code plus evidence, blocked with a reason, or explicitly non-automatable with a verification note.

## Workflow

1. Identify the controlling contract: an approved spec, `2-tech-spec.md`, explicit AC list, issue body, or user-provided implementation brief.
2. Read `references/execution-protocol.md`.
3. Extract or assign stable AC IDs. Read `references/ac-traceability.md` when recording evidence.
4. Pick the verification level from `references/testing-strategy.md`.
5. Implement the smallest scoped change that satisfies the ACs.
6. Produce machine-readable AC evidence as `ac-evidence.json` when running inside an auto-loop.
7. Record a request log for medium or complex work. Read `references/request-log-template.md` before writing it.
8. Run the maker self-check script when deterministic gate validation is needed.
9. Stop only when the AC evidence is complete or the blocker is explicit.

## Authority Order

Use the most specific active source first:

1. Current user instruction and repo-specific agent instructions.
2. Approved or frozen task spec, when the project has one.
3. `docs/features/<feature>/2-tech-spec.md` or another tech spec named by the user.
4. Requirements documents that define product behavior and business rules.
5. Feasibility studies that define selected options, risk checks, or non-goals.
6. Discovery memos as context only.

If sources conflict, stop and ask for spec review. Do not silently edit ACs or widen scope.

## Core Rules

- Implement by AC, not by vague completion feeling.
- Do not modify acceptance criteria or widen implementation scope unless the task explicitly asks for it.
- For small tasks with only a tech spec, unit tests or targeted static checks must map to the tech-spec ACs.
- For medium or complex tasks, add integration or E2E coverage when requirements, feasibility risks, data flow, permissions, or user-visible journeys require it.
- If a test cannot be automated, record why and provide a concrete alternate verification method.
- In auto-loop mode, the Maker Agent owns the semantic mapping from AC IDs to proof. Scripts only validate that the mapping is complete and mechanically consistent.

## Auto-loop Artifact

After implementation in an auto-loop, compare the final diff against the ACs and produce `ac-evidence.json` using `references/ac-evidence-template.json`.

## Scripts

- `scripts/check-ac-traceability.mjs <request-log.md> [--spec <spec.md>]`: verify that AC evidence exists and every recorded AC has proof or a justified exemption.
- `scripts/check-request-log.mjs <request-log.md>`: verify required request-log sections are present and non-empty.
- `scripts/check-maker-self-check.mjs --ac-evidence <file>`: validate `ac-evidence.json`; it does not create a second result file.

Run scripts with Node.js. They have no package dependencies.
