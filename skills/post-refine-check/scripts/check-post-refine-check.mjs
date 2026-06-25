#!/usr/bin/env node
import fs from "node:fs";

const GATES = new Set(["ready", "ready_with_concerns", "blocked"]);
const FINDING_LEVELS = new Set(["blocked", "concern"]);
const AC_STATUSES = new Set(["pass", "fail", "unknown", "not-applicable"]);
const COMMAND_STATUSES = new Set(["passed", "failed", "not-run"]);

function usage() {
  console.error("Usage: check-post-refine-check.mjs --post-refine <file>");
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

function validateCommands(errors, commands, collection) {
  for (const [index, command] of commands.entries()) {
    const row = index + 1;
    if (!hasText(command.command)) {
      errors.push(`${collection}[${row}].command is required`);
    }
    if (!COMMAND_STATUSES.has(String(command.status || ""))) {
      errors.push(`${collection}[${row}].status is invalid`);
    }
    if (
      command.exitCode !== undefined &&
      (!Number.isInteger(command.exitCode) || command.exitCode < 0)
    ) {
      errors.push(`${collection}[${row}].exitCode must be a non-negative integer`);
    }
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const reportPath = options["post-refine"];

  if (!reportPath) {
    usage();
    process.exit(2);
  }

  const report = readJson(reportPath);
  const findings = asArray(report.findings);
  const acRegression = asArray(report.acRegression);
  const baselineCommands = asArray(report.validation?.baselineCommands);
  const additionalCommands = asArray(report.validation?.additionalCommands);
  const blockers = asArray(report.blockers);
  const errors = [];

  if (report.schemaVersion !== 1) {
    errors.push("schemaVersion must be 1");
  }
  if (report.stage !== "post-refine-check") {
    errors.push("stage must be 'post-refine-check'");
  }
  if (!GATES.has(report.gate)) {
    errors.push("gate must be 'ready', 'ready_with_concerns', or 'blocked'");
  }

  for (const [index, finding] of findings.entries()) {
    const row = index + 1;
    if (!FINDING_LEVELS.has(String(finding.level || ""))) {
      errors.push(`findings[${row}].level must be blocked or concern`);
    }
    if (!hasText(finding.file)) {
      errors.push(`findings[${row}].file is required`);
    }
    if (!Number.isInteger(finding.line) || finding.line < 1) {
      errors.push(`findings[${row}].line must be a positive integer`);
    }
    for (const field of ["title", "impact", "evidence", "requiredAction"]) {
      if (!hasText(finding[field])) {
        errors.push(`findings[${row}].${field} is required`);
      }
    }
  }

  for (const [index, item] of acRegression.entries()) {
    const row = index + 1;
    if (!/^AC-\d{3,}$/i.test(String(item.acId || ""))) {
      errors.push(`acRegression[${row}].acId must use AC-001 style`);
    }
    if (!AC_STATUSES.has(String(item.status || ""))) {
      errors.push(`acRegression[${row}].status is invalid`);
    }
    if (!hasText(item.evidence)) {
      errors.push(`acRegression[${row}].evidence is required`);
    }
  }

  validateCommands(errors, baselineCommands, "validation.baselineCommands");
  validateCommands(errors, additionalCommands, "validation.additionalCommands");

  if (typeof report.validation?.testChangesInspected !== "boolean") {
    errors.push("validation.testChangesInspected must be boolean");
  }

  for (const [index, blocker] of blockers.entries()) {
    const row = index + 1;
    if (!hasText(blocker.code)) {
      errors.push(`blockers[${row}].code is required`);
    }
    if (!Number.isInteger(blocker.count) || blocker.count < 1) {
      errors.push(`blockers[${row}].count must be a positive integer`);
    }
  }

  const blockedFindings = findings.filter((item) => item.level === "blocked").length;
  const concernFindings = findings.filter((item) => item.level === "concern").length;
  const acFailed = acRegression.filter((item) => item.status === "fail").length;
  const acUnknown = acRegression.filter((item) => item.status === "unknown").length;
  const baselineFailed = baselineCommands.filter((item) => item.status === "failed").length;
  const additionalFailed = additionalCommands.filter((item) => item.status === "failed").length;
  const commandsNotRun = baselineCommands
    .concat(additionalCommands)
    .filter((item) => item.status === "not-run").length;
  const residualRisk = Boolean(report.residualRisk);
  const testChangesInspected = report.validation?.testChangesInspected === true;

  const computedBlockers = [];
  if (blockedFindings > 0) {
    computedBlockers.push({ code: "BLOCKING_FINDINGS", count: blockedFindings });
  }
  if (acFailed > 0) {
    computedBlockers.push({ code: "AC_REGRESSION", count: acFailed });
  }
  if (baselineFailed + additionalFailed > 0) {
    computedBlockers.push({
      code: "POST_REFINE_VALIDATION_FAILED",
      count: baselineFailed + additionalFailed,
    });
  }
  if (blockers.length > 0) {
    computedBlockers.push(...blockers);
  }
  if (errors.length > 0) {
    computedBlockers.push({ code: "INVALID_POST_REFINE_REPORT", count: errors.length });
  }

  let gate = "ready";
  if (computedBlockers.length > 0) {
    gate = "blocked";
  } else if (
    concernFindings > 0 ||
    acUnknown > 0 ||
    commandsNotRun > 0 ||
    residualRisk ||
    !testChangesInspected
  ) {
    gate = "ready_with_concerns";
  }

  if (report.gate && report.gate !== gate) {
    errors.push(`gate must be '${gate}' for the recorded post-refine check`);
    computedBlockers.push({ code: "GATE_MISMATCH", count: 1 });
  }

  const summary = {
    schemaVersion: 1,
    stage: "post-refine-check",
    gate: report.gate || gate,
    artifact: reportPath,
    metrics: {
      blockedFindings,
      concernFindings,
      acFailed,
      acUnknown,
      baselineFailed,
      additionalFailed,
      commandsNotRun,
      residualRisk,
      testChangesInspected,
      errors: errors.length,
    },
    blockers: computedBlockers,
    errors,
  };

  console.log(JSON.stringify(summary, null, 2));

  process.exit(errors.length === 0 && gate !== "blocked" ? 0 : 1);
}

try {
  main();
} catch (error) {
  console.error(`post-refine check failed: ${error.message}`);
  process.exit(1);
}
