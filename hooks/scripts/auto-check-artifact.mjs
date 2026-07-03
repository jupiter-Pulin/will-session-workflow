#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

// PostToolUse hook for Write|Edit: when a stage artifact lands on disk, run
// the owning skill's deterministic checker and feed the result back to the
// model as additionalContext. Exact-basename matching keeps this silent in
// every project that does not use the workflow artifacts.

const CHECKERS = {
  "ac-evidence.json": ["skills/maker-ai-workflow/scripts/check-maker-self-check.mjs", "--ac-evidence"],
  "review-diff.json": ["skills/review-diff/scripts/check-review-diff.mjs", "--review"],
  "refine-diff.json": ["skills/refine-diff/scripts/check-refine-diff.mjs", "--refine"],
  "post-refine-check.json": ["skills/post-refine-check/scripts/check-post-refine-check.mjs", "--post-refine"],
  "test-gate.json": ["skills/test-gate/scripts/check-test-gate.mjs", "--test-gate"],
};

const OUTPUT_LIMIT = 4000;

function main() {
  let payload;
  try {
    payload = JSON.parse(fs.readFileSync(0, "utf8"));
  } catch {
    process.exit(0);
  }

  if (!["Write", "Edit"].includes(payload.tool_name)) process.exit(0);
  const filePath = String(payload.tool_input?.file_path || "");
  const checker = CHECKERS[path.basename(filePath)];
  if (!checker || !fs.existsSync(filePath)) process.exit(0);

  const pluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
  const [scriptRelPath, flag] = checker;
  const scriptPath = path.join(pluginRoot, scriptRelPath);
  if (!fs.existsSync(scriptPath)) process.exit(0);

  const result = spawnSync("node", [scriptPath, flag, filePath], {
    encoding: "utf8",
    timeout: 45_000,
  });

  const output = `${result.stdout || ""}${result.stderr || ""}`.trim().slice(0, OUTPUT_LIMIT);
  const verdict = result.status === 0 ? "passed" : "FAILED";

  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PostToolUse",
        additionalContext:
          `session-workflow auto-check: ${path.basename(scriptRelPath)} ${verdict} (exit ${result.status}) for ${filePath}.\n` +
          `${output}\n` +
          (result.status === 0
            ? ""
            : "Fix the artifact so the checker passes before advancing the run state."),
      },
    })
  );
  process.exit(0);
}

main();
