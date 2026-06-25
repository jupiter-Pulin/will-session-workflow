---
name: create-skill
description: Create or update reusable team Claude skills from repeated AI workflows, prompt patterns, tool sequences, validation routines, domain rules, or automation steps. Use when the user asks to create a skill, invokes /create-skill, wants to capture a workflow for future agents, or when Claude identifies a repeated engineering practice that should be preserved instead of rediscovered.
---

# Create Skill

Use this skill to turn repeatable AI work into concise, discoverable, validated skills. Prefer a small workflow skill with clear triggers over a broad knowledge dump.

## Candidate Gate

Create or update a skill only when at least two are true:

- The workflow has repeated or is likely to repeat.
- The task requires non-obvious team, project, domain, or tool knowledge.
- The task has a fragile sequence that benefits from explicit guardrails.
- The work repeatedly uses the same commands, scripts, schemas, templates, or assets.
- Failure is costly enough that future agents need clear validation steps.

If the gate is not met, choose a smaller artifact:

- Stable project-wide rule: update `AGENTS.md`.
- Long API, schema, policy, or domain material: add a reference file to an existing skill or project docs.
- Deterministic repeated operation: add a script to the relevant existing skill.
- One-off status, decision, or implementation trace: write a request log, issue, or feature doc.
- Product or engineering feature planning: use `/ai-tech-spec`.

## Target And Naming

Default to `$HOME/.claude/skills` for global skills unless the user gives another path. For repository-local or plugin skills, use the path requested by the user or the convention already present in the repo (for a plugin, the `skills/` directory under the plugin root).

Name skills with lowercase letters, digits, and hyphens only. Prefer short verb-led names under 64 characters, and make the folder name exactly match the skill name.

Before creating a new skill, search existing skills for overlap. Update an existing skill when the new workflow is a clear extension of the same trigger surface.

## Skill Shape

Use the smallest structure that supports the workflow:

- `SKILL.md`: required. Keep trigger logic, scope, decision rules, workflow, resource loading, validation, and output expectations here.
- Skill metadata lives entirely in the `SKILL.md` YAML frontmatter (`name`, `description`); Claude skills have no separate agent metadata file. If a workflow needs a dedicated subagent, add a plugin-level `agents/<name>.md` and keep its description consistent with `SKILL.md`.
- `references/`: use for detailed knowledge that should load only when needed.
- `scripts/`: use for deterministic, repeated, or fragile operations.
- `assets/`: use for templates, boilerplate, images, fonts, or files copied into outputs.

Do not add `README.md`, `CHANGELOG.md`, `INSTALLATION.md`, or `QUICK_REFERENCE.md` to a skill unless the user explicitly asks. Those files usually create context noise rather than better agent behavior.

## Workflow

1. Collect one to three concrete examples of the requests that should trigger the skill. If examples or target location are unclear, ask only the smallest necessary question.
2. Decide whether to create a new skill, update an existing skill, or use a smaller artifact from the Candidate Gate.
3. Choose the degree of freedom: use prose rules for judgment-heavy work, pseudocode or templates for patterned work, and scripts for deterministic or fragile work.
4. Plan resources before writing. Add references, scripts, or assets only when they remove repeated work or reduce real failure risk.
5. Create the skill with the bundled `skill-creator` skill when available — invoke `/skill-creator` and let it scaffold the folder and a starter `SKILL.md`. Default the target to `$HOME/.claude/skills` for global skills, or the plugin's `skills/` directory for a plugin skill, unless the user gives another path.

6. Write `SKILL.md`. Put all trigger conditions in the YAML `description`; the body is loaded only after the skill triggers.
7. If creating a new skill from scratch, read `references/skill-template.md` and adapt the default template. Delete sections that do not apply.
8. Finalize the `SKILL.md` frontmatter after the main content is stable: a `name` that matches the folder, and a `description` that carries all trigger conditions. If the workflow needs a dedicated subagent, add a plugin-level `agents/<name>.md`.
9. Delete placeholder files and empty resource directories that are not needed.
10. Validate the skill and fix any reported issues before finishing.

## Writing Rules

- Write for another AI agent, not for a human reader browsing documentation.
- Use imperative, concise instructions.
- Keep `SKILL.md` under 500 lines. Move detailed schemas, examples, or variant-specific guidance into one-level reference files.
- Avoid generic advice such as "be careful" or "follow best practices." Replace it with observable checks or commands.
- Make resource loading conditional. Tell the agent exactly which reference to read for which task.
- State when scripts should be run. Scripts are not automatic hooks; the agent must call them during the workflow.
- Preserve unrelated user edits when updating existing skills.

## Validation

Run the bundled validator when available — invoke `/skill-creator` and ask it to validate `<path-to-skill-folder>` (it runs its `quick_validate.py` check on the frontmatter and structure).

For skills with scripts, execute at least one representative script command. For fragile or complex workflow skills, forward-test with a realistic request after writing the skill.

If validation cannot run, report the exact command attempted and the reason it failed.

## Output

Finish with:

- Skill name and path.
- Why the skill should exist.
- Files created or changed.
- Resources added and why.
- Validation commands and results.
- Remaining risks or follow-up work.
