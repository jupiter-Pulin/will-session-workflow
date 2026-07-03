# will-session-workflow

A Claude Code plugin marketplace bundling skills, subagents, and hooks for an AI-assisted development session workflow.

## Install

```text
/plugin marketplace add jupiter-Pulin/will-session-workflow
/plugin install session-workflow@will-session-workflow
```

Then restart Claude Code (or run `/reload-plugins`). Skills are namespaced under the plugin, e.g. `/session-workflow:ai-tech-spec`.

## Included skills

| Skill | Purpose |
| :---- | :------ |
| `ai-tech-spec` | Tech-spec, requirements, feasibility, and implementation-plan authoring. |
| `test-gate` | Probe AC-mapped tests against the pre-change baseline in an isolated worktree; block vacuous or mock-only coverage. |
| `review-diff` | Structured review of a code diff. |
| `refine-diff` | Recommend simplification/reuse cleanups on an already-correct diff (report only; MakerAgent applies changes). |
| `post-refine-check` | Verification gate after refinement. |
| `auto-loop-orchestrator` | Drive a multi-step run via a state machine. |
| `maker-ai-workflow` | AC traceability, request-log, and self-check workflow. |
| `ai-discovery-collision` | Discovery / collision exploration loop. |
| `create-skill` | Scaffold new Claude Code skills. |

## Included agents

Read-only subagents that make review independence mechanical (`Write`/`Edit` disabled by tool policy, fresh context by construction):

| Agent | Purpose |
| :---- | :------ |
| `reviewer` | Runs `review-diff` with fresh context; returns findings and a merge gate. |
| `refiner` | Runs `refine-diff`; returns refinement opportunities, never applies them. |
| `post-refine-checker` | Runs `post-refine-check`; reruns baseline validation and returns the final gate. |

## Included hooks

Loaded automatically from `hooks/hooks.json` when the plugin is enabled:

| Hook | Event | Purpose |
| :---- | :---- | :------ |
| `git-safety` | PreToolUse (Bash) | Allow local commits; deny `git push` and irreversible operations (`reset --hard`, `clean -f`, `stash drop`, ...) with a message telling the agent to hand the command to the user. |
| `auto-check-artifact` | PostToolUse (Write/Edit) | When a stage artifact (`ac-evidence.json`, `review-diff.json`, `refine-diff.json`, `post-refine-check.json`, `test-gate.json`) is written, run the owning skill's checker automatically and feed the result back. |
| `capture-validation` | PostToolUse (Bash) | While an auto-loop run is in a Maker-owned state, record real test/lint/build command output into the run's `validation/` directory, so evidence is harness-captured instead of self-reported. |

## License

MIT
