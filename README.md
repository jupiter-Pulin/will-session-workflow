# will-session-workflow

A Claude Code plugin marketplace bundling skills for an AI-assisted development session workflow.

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
| `review-diff` | Structured review of a code diff. |
| `refine-diff` | Apply review feedback and refine a diff. |
| `post-refine-check` | Verification gate after refinement. |
| `auto-loop-orchestrator` | Drive a multi-step run via a state machine. |
| `maker-ai-workflow` | AC traceability, request-log, and self-check workflow. |
| `ai-discovery-collision` | Discovery / collision exploration loop. |
| `create-skill` | Scaffold new Claude Code skills. |

## License

MIT
