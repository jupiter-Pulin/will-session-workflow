#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

// PostToolUse hook for Bash: while an auto-loop run is in a Maker-owned state,
// capture real test/lint/build command output into the run's validation/
// directory. Evidence is recorded by the harness instead of self-reported by
// the model. Silent (exit 0, no output) in every other situation.

const CAPTURE_STATES = new Set(["maker", "maker-self-check", "review-fix", "refine-apply"]);

const VALIDATION_PATTERNS = [
  /\b(?:npm|yarn|pnpm|bun)\s+(?:run\s+)?(?:test|lint|typecheck|type-check|build|check)\b/,
  /\b(?:jest|vitest|mocha|ava|playwright|cypress)\b/,
  /\b(?:pytest|tox|ruff|mypy)\b/,
  /\bgo\s+(?:test|vet)\b/,
  /\bcargo\s+(?:test|clippy|check)\b/,
  /\b(?:tsc|eslint|biome)\b/,
  /\b(?:mvn|gradle|gradlew)\s+(?:test|verify|check)\b/,
  /\b(?:phpunit|rspec)\b/,
];

const OUTPUT_LIMIT = 20000;

function findRunsDir(startDir) {
  let dir = startDir;
  for (let depth = 0; depth < 24; depth += 1) {
    const candidate = path.join(dir, ".agent-runs");
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
  return null;
}

function findActiveRun(runsDir) {
  let entries;
  try {
    entries = fs.readdirSync(runsDir, { withFileTypes: true });
  } catch {
    return null;
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const statePath = path.join(runsDir, entry.name, "run-state.json");
    try {
      const run = JSON.parse(fs.readFileSync(statePath, "utf8"));
      const current = run.state?.current;
      const status = run.state?.status;
      if (status === "running" && CAPTURE_STATES.has(current)) {
        return { runDir: path.join(runsDir, entry.name), state: current };
      }
    } catch {
      // Unreadable ledger: not an active run for capture purposes.
    }
  }
  return null;
}

function serializeResponse(toolResponse) {
  if (toolResponse == null) return "";
  const text = typeof toolResponse === "string" ? toolResponse : JSON.stringify(toolResponse);
  return text.slice(0, OUTPUT_LIMIT);
}

function main() {
  let payload;
  try {
    payload = JSON.parse(fs.readFileSync(0, "utf8"));
  } catch {
    process.exit(0);
  }

  if (payload.tool_name !== "Bash") process.exit(0);
  const command = String(payload.tool_input?.command || "");
  if (!command || !VALIDATION_PATTERNS.some((pattern) => pattern.test(command))) process.exit(0);

  const runsDir = findRunsDir(payload.cwd || process.cwd());
  if (!runsDir) process.exit(0);
  const active = findActiveRun(runsDir);
  if (!active) process.exit(0);

  const validationDir = path.join(active.runDir, "validation");
  fs.mkdirSync(validationDir, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const record = {
    capturedAt: new Date().toISOString(),
    state: active.state,
    cwd: payload.cwd || process.cwd(),
    command,
    output: serializeResponse(payload.tool_response),
  };

  fs.writeFileSync(
    path.join(validationDir, `${stamp}-command.json`),
    `${JSON.stringify(record, null, 2)}\n`
  );
  process.exit(0);
}

main();
