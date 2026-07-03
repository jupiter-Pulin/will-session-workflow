#!/usr/bin/env node
import fs from "node:fs";

const BASELINE_RESULTS = new Set(["passed", "failed", "error", "not-run"]);
const VERDICTS = new Set(["falsifies", "vacuous", "unknown"]);
const MOCK_STATUSES = new Set(["real", "mocked", "partial"]);

function usage() {
  console.error("Usage: check-test-gate.mjs --test-gate <file>");
}

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) {
      throw new Error(`Unexpected positional argument: ${arg}`);
    }
    const key = arg.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for --${key}`);
    }
    options[key] = value;
    index += 1;
  }
  return options;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function hasText(value) {
  return Boolean(String(value || "").trim());
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const testGatePath = options["test-gate"];

  if (!testGatePath) {
    usage();
    process.exit(2);
  }

  const testGate = readJson(testGatePath);
  const acProbes = asArray(testGate.acProbes);
  const mockBoundary = asArray(testGate.mockBoundary);
  const errors = [];

  if (testGate.schemaVersion !== 1) {
    errors.push("schemaVersion must be 1");
  }
  if (testGate.stage !== "test-gate") {
    errors.push("stage must be 'test-gate'");
  }
  if (!["ready", "ready_with_concerns", "blocked"].includes(testGate.gate)) {
    errors.push("gate must be 'ready', 'ready_with_concerns', or 'blocked'");
  }

  for (const [index, probe] of acProbes.entries()) {
    const row = index + 1;
    if (!/^AC-\d{3,}$/i.test(String(probe.acId || ""))) {
      errors.push(`acProbes[${row}].acId must use AC-001 style`);
    }
    if (!hasText(probe.testCommand)) {
      errors.push(`acProbes[${row}].testCommand is required`);
    }
    if (!hasText(probe.baselineRef)) {
      errors.push(`acProbes[${row}].baselineRef is required`);
    }
    if (!BASELINE_RESULTS.has(String(probe.baselineResult || ""))) {
      errors.push(`acProbes[${row}].baselineResult is invalid`);
    }
    if (!VERDICTS.has(String(probe.verdict || ""))) {
      errors.push(`acProbes[${row}].verdict is invalid`);
    }
    if (probe.verdict === "unknown" && !hasText(probe.notes)) {
      errors.push(`acProbes[${row}] has verdict 'unknown' but no notes explaining why`);
    }
  }

  for (const [index, item] of mockBoundary.entries()) {
    const row = index + 1;
    if (!/^AC-\d{3,}$/i.test(String(item.acId || ""))) {
      errors.push(`mockBoundary[${row}].acId must use AC-001 style`);
    }
    if (!MOCK_STATUSES.has(String(item.status || ""))) {
      errors.push(`mockBoundary[${row}].status is invalid`);
    }
    if (!hasText(item.notes)) {
      errors.push(`mockBoundary[${row}].notes is required`);
    }
  }

  const vacuous = acProbes.filter((p) => p.verdict === "vacuous").length;
  const unresolved = acProbes.filter(
    (p) => p.baselineResult === "error" || p.baselineResult === "not-run"
  ).length;
  const mocked = mockBoundary.filter((m) => m.status !== "real").length;
  const residualRisk = Boolean(testGate.residualRisk);
  const blockers = [];

  if (vacuous > 0) {
    blockers.push({ code: "VACUOUS_TEST", count: vacuous });
  }
  if (errors.length > 0) {
    blockers.push({ code: "INVALID_TEST_GATE_REPORT", count: errors.length });
  }

  let gate = "ready";
  if (blockers.length > 0) {
    gate = "blocked";
  } else if (unresolved > 0 || mocked > 0 || residualRisk) {
    gate = "ready_with_concerns";
  }

  if (testGate.gate && testGate.gate !== gate) {
    errors.push(`gate must be '${gate}' for the recorded probes`);
    blockers.push({ code: "GATE_MISMATCH", count: 1 });
  }

  const summary = {
    schemaVersion: 1,
    stage: "test-gate",
    gate: testGate.gate || gate,
    artifact: testGatePath,
    metrics: {
      acProbed: acProbes.length,
      vacuous,
      unresolved,
      mocked,
      residualRisk,
      errors: errors.length,
    },
    blockers,
    errors,
  };

  console.log(JSON.stringify(summary, null, 2));

  process.exit(errors.length === 0 && gate !== "blocked" ? 0 : 1);
}

try {
  main();
} catch (error) {
  console.error(`test gate check failed: ${error.message}`);
  process.exit(1);
}
