#!/usr/bin/env node
import fs from "node:fs";

const AC_STATUSES = new Set(["pass", "blocked", "not-automatable", "deferred"]);
const COMMAND_STATUSES = new Set(["passed", "failed", "not-run"]);

function usage() {
  console.error("Usage: check-maker-self-check.mjs --ac-evidence <file>");
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

function hasProof(item) {
  return asArray(item.proof).length > 0;
}

function hasNotes(item) {
  return Boolean(String(item.notes || "").trim());
}

function hasRequiredEvidence(item) {
  if (item.status === "pass") {
    return hasProof(item);
  }
  return hasProof(item) || hasNotes(item);
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const acEvidencePath = options["ac-evidence"];

  if (!acEvidencePath) {
    usage();
    process.exit(2);
  }

  const evidence = readJson(acEvidencePath);
  const acRows = asArray(evidence.ac);
  const commands = asArray(evidence.validation?.commands);
  const blockers = [];
  const errors = [];
  const seen = new Set();

  if (evidence.schemaVersion !== 1) {
    errors.push("schemaVersion must be 1");
  }
  if (evidence.stage !== "maker-self-check") {
    errors.push("stage must be 'maker-self-check'");
  }
  if (!["verified", "blocked"].includes(evidence.gate)) {
    errors.push("gate must be 'verified' or 'blocked'");
  }

  if (acRows.length === 0) {
    blockers.push({ code: "NO_AC_EVIDENCE", count: 1 });
  }

  for (const [index, item] of acRows.entries()) {
    const row = index + 1;
    const id = String(item.id || "");
    const status = String(item.status || "");

    if (!/^AC-\d{3,}$/i.test(id)) {
      errors.push(`ac[${row}].id must use AC-001 style`);
    } else if (seen.has(id.toUpperCase())) {
      errors.push(`duplicate AC id ${id}`);
    } else {
      seen.add(id.toUpperCase());
    }

    if (!AC_STATUSES.has(status)) {
      errors.push(`ac[${row}].status is invalid`);
    }

    if (!hasRequiredEvidence(item)) {
      if (status === "pass") {
        errors.push(`ac[${row}] with status pass is missing proof`);
      } else {
        errors.push(`ac[${row}] is missing proof or notes`);
      }
    }
  }

  for (const [index, command] of commands.entries()) {
    const status = String(command.status || "");
    if (!COMMAND_STATUSES.has(status)) {
      errors.push(`validation.commands[${index + 1}].status is invalid`);
    }
  }

  const acTotal = acRows.length;
  const acPassed = acRows.filter((item) => item.status === "pass").length;
  const acBlocked = acRows.filter((item) => item.status === "blocked").length;
  const acNotAutomatable = acRows.filter((item) => item.status === "not-automatable").length;
  const acDeferred = acRows.filter((item) => item.status === "deferred").length;
  const missingProof = acRows.filter((item) => !hasRequiredEvidence(item)).length;
  const commandsFailed = commands.filter((item) => item.status === "failed").length;
  const commandsNotRun = commands.filter((item) => item.status === "not-run").length;

  if (acBlocked > 0) {
    blockers.push({ code: "AC_BLOCKED", count: acBlocked });
  }
  if (missingProof > 0) {
    blockers.push({ code: "MISSING_PROOF", count: missingProof });
  }
  if (commandsFailed > 0) {
    blockers.push({ code: "VALIDATION_FAILED", count: commandsFailed });
  }
  if (errors.length > 0) {
    blockers.push({ code: "INVALID_AC_EVIDENCE", count: errors.length });
  }

  const computedGate = blockers.length === 0 ? "verified" : "blocked";
  if (evidence.gate && evidence.gate !== computedGate) {
    errors.push(`gate must be '${computedGate}' for the recorded evidence`);
    blockers.push({ code: "GATE_MISMATCH", count: 1 });
  }

  const summary = {
    schemaVersion: 1,
    stage: "maker-self-check",
    gate: evidence.gate || computedGate,
    artifact: acEvidencePath,
    metrics: {
      acTotal,
      acPassed,
      acBlocked,
      acNotAutomatable,
      acDeferred,
      missingProof,
      commandsFailed,
      commandsNotRun,
      errors: errors.length,
    },
    blockers,
    errors,
  };

  console.log(JSON.stringify(summary, null, 2));

  process.exit(errors.length === 0 && computedGate === "verified" ? 0 : 1);
}

try {
  main();
} catch (error) {
  console.error(`maker self-check failed: ${error.message}`);
  process.exit(1);
}
