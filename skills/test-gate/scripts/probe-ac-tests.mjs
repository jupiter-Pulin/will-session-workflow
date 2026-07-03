#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const BASELINE_RESULTS = new Set(["passed", "failed", "error", "not-run"]);

function usage() {
  console.error(`Usage: probe-ac-tests.mjs <ac-evidence.json> --baseline <ref> [--repo-root <dir>] [--map <file>] [--out <file>]

For each AC in ac-evidence.json with status "pass", find its mapped test command
and run that command inside an isolated git worktree checked out at --baseline.
A test that still passes against the baseline is vacuous: it does not prove the
new behavior. A test that fails against the baseline falsifies correctly.

The main working tree is never touched; the worktree is created under the OS
temp directory and always removed before this script exits.`);
}

function parseArgs(argv) {
  const options = { positional: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--baseline") {
      options.baseline = argv[++index];
    } else if (arg === "--repo-root") {
      options.repoRoot = argv[++index];
    } else if (arg === "--map") {
      options.map = argv[++index];
    } else if (arg === "--out") {
      options.out = argv[++index];
    } else if (arg === "--help" || arg === "-h") {
      usage();
      process.exit(0);
    } else if (arg.startsWith("--")) {
      throw new Error(`Unknown argument: ${arg}`);
    } else {
      options.positional.push(arg);
    }
  }
  if (options.positional.length !== 1) {
    usage();
    process.exit(2);
  }
  if (!options.baseline) {
    throw new Error("--baseline <ref> is required");
  }
  return options;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function run(command, args, cwd) {
  return spawnSync(command, args, { cwd, encoding: "utf8" });
}

function resolveRepoRoot(explicit) {
  if (explicit) return path.resolve(explicit);
  const result = run("git", ["rev-parse", "--show-toplevel"], process.cwd());
  if (result.status !== 0) {
    throw new Error("Could not resolve repo root; pass --repo-root explicitly.");
  }
  return result.stdout.trim();
}

function buildAcToCommand(evidence, mapPath) {
  if (mapPath) {
    return readJson(mapPath);
  }
  const commands = asArray(evidence.validation?.commands);
  const byArtifact = new Map();
  for (const command of commands) {
    if (command.artifact) byArtifact.set(command.artifact, command.command);
  }
  const mapping = {};
  for (const ac of asArray(evidence.ac)) {
    if (ac.status !== "pass") continue;
    const commandProof = asArray(ac.proof).find((p) => p.type === "command" && p.ref);
    if (commandProof && byArtifact.has(commandProof.ref)) {
      mapping[ac.id] = byArtifact.get(commandProof.ref);
    }
  }
  return mapping;
}

function cleanupWorktree(repoRoot, worktreePath) {
  const remove = run("git", ["worktree", "remove", "--force", worktreePath], repoRoot);
  if (remove.status !== 0) {
    fs.rmSync(worktreePath, { recursive: true, force: true });
    run("git", ["worktree", "prune"], repoRoot);
  }
}

function probeOne(repoRoot, baseline, acId, testCommand, index) {
  if (!testCommand) {
    return {
      acId,
      testCommand: "",
      baselineRef: baseline,
      baselineResult: "not-run",
      verdict: "unknown",
      notes: "No mapped test command found for this AC. Supply --map to link it explicitly.",
    };
  }

  const worktreePath = path.join(
    fs.realpathSync(os.tmpdir()),
    `test-gate-${process.pid}-${index}`
  );

  const add = run("git", ["worktree", "add", "--detach", worktreePath, baseline], repoRoot);
  if (add.status !== 0) {
    return {
      acId,
      testCommand,
      baselineRef: baseline,
      baselineResult: "error",
      verdict: "unknown",
      notes: `git worktree add failed: ${(add.stderr || "").trim().slice(0, 500)}`,
    };
  }

  try {
    const testRun = spawnSync(testCommand, { cwd: worktreePath, shell: true, encoding: "utf8" });
    if (testRun.error) {
      return {
        acId,
        testCommand,
        baselineRef: baseline,
        baselineResult: "error",
        verdict: "unknown",
        notes: `Test command failed to spawn: ${testRun.error.message}`,
      };
    }
    const baselineResult = testRun.status === 0 ? "passed" : "failed";
    const verdict = baselineResult === "failed" ? "falsifies" : "vacuous";
    const notes =
      verdict === "vacuous"
        ? "Test still passes against the pre-change baseline; it does not pin the new behavior."
        : "Test fails against the pre-change baseline and passes on the current change; it falsifies correctly.";
    return { acId, testCommand, baselineRef: baseline, baselineResult, verdict, notes };
  } finally {
    cleanupWorktree(repoRoot, worktreePath);
  }
}

function computeGate(acProbes) {
  const vacuous = acProbes.filter((p) => p.verdict === "vacuous").length;
  const unresolved = acProbes.filter((p) => p.baselineResult === "error" || p.baselineResult === "not-run").length;
  const blockers = [];
  if (vacuous > 0) blockers.push({ code: "VACUOUS_TEST", count: vacuous });
  let gate = "ready";
  if (blockers.length > 0) gate = "blocked";
  else if (unresolved > 0) gate = "ready_with_concerns";
  return { gate, blockers };
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const evidencePath = options.positional[0];
  const evidence = readJson(evidencePath);
  const repoRoot = resolveRepoRoot(options.repoRoot);
  const mapping = buildAcToCommand(evidence, options.map);

  const passingAcs = asArray(evidence.ac).filter((ac) => ac.status === "pass");
  const acProbes = passingAcs.map((ac, index) =>
    probeOne(repoRoot, options.baseline, ac.id, mapping[ac.id], index)
  );

  const { gate, blockers } = computeGate(acProbes);

  const result = {
    schemaVersion: 1,
    stage: "test-gate",
    gate,
    acProbes,
    mockBoundary: [],
    residualRisk: false,
    blockers,
  };

  const output = JSON.stringify(result, null, 2);
  if (options.out) {
    fs.writeFileSync(options.out, `${output}\n`);
  }
  console.log(output);

  process.exit(gate === "blocked" ? 1 : 0);
}

try {
  main();
} catch (error) {
  console.error(`probe-ac-tests failed: ${error.message}`);
  process.exit(1);
}
