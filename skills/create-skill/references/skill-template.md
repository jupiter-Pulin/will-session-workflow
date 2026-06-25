# Skill Template

Use this skeleton when creating a new team skill. Delete sections that do not apply.

```md
---
name: skill-name
description: <Core action or purpose>. Use when <trigger phrases, task types, file types, tools, or contexts should load this skill>. Not for <nearby tasks that should use another skill or no skill>.
---

# Skill Title

Use this skill to ...

## Scope

Use this skill for:

- ...

Do not use this skill for:

- ...

## Decision Rules

Before starting, decide:

- ...

If ..., then ...
If ..., then ...

## Workflow

1. Inspect ...
2. Choose ...
3. Read only the required reference ...
4. Create or edit ...
5. Validate ...
6. Report ...

## Resource Loading

Load only the files needed for the current task:

- For ..., read `references/...`.
- For ..., read `references/...`.

Do not read all references by default.

## Scripts

Use scripts only at the specified workflow points:

- Before ..., run `python3 scripts/...`.
- After ..., run `python3 scripts/...`.
- If validation fails, fix the reported issue and rerun.

## Validation

Run:

```bash
...
```

## Output

Finish with:

- Files created or changed.
- Validation performed.
- Known risks or follow-up work.
```

Quality checks:

- The YAML frontmatter contains only `name` and `description`.
- The `description` states the core action, when to use the skill, and important boundaries.
- The skill has clear scope and non-scope.
- The workflow is executable, not essay-like.
- References are loaded conditionally.
- Scripts have explicit invocation timing.
- The skill avoids extra documentation files that are not agent-facing.
