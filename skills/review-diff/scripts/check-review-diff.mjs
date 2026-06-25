#!/usr/bin/env node
import fs from "node:fs";

const SEVERITIES = new Set(["P0", "P1", "P2"]);
const AC_STATUSES = new Set(["pass", "fail", "unknown", "not-applicable"]);
const COMMAND_STATUSES = new Set(["passed", "failed", "not-run"]);

function usage() {
  console.error("Usage: check-review-diff.mjs --review <file>");
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
  const reviewPath = options.review;

  if (!reviewPath) {
    usage();
    process.exit(2);
  }

  const review = readJson(reviewPath);
  const findings = asArray(review.findings);
  const acCoverage = asArray(review.acCoverage);
  const testsRun = asArray(review.tests?.run);
  const blockers = [];
  const errors = [];

  if (review.schemaVersion !== 1) {
    errors.push("schemaVersion must be 1");
  }
  if (review.stage !== "review-diff") {
    errors.push("stage must be 'review-diff'");
  }
  if (!["ready", "ready_with_concerns", "blocked"].includes(review.gate)) {
    errors.push("gate must be 'ready', 'ready_with_concerns', or 'blocked'");
  }

  for (const [index, finding] of findings.entries()) {
    const row = index + 1;
    const severity = String(finding.severity || "");
    if (!SEVERITIES.has(severity)) {
      errors.push(`findings[${row}].severity is invalid`);
    }
    for (const field of ["file", "line", "title", "impact", "trigger", "evidence", "fix"]) {
      if (field === "line") {
        if (!Number.isInteger(finding.line) || finding.line < 1) {
          errors.push(`findings[${row}].line must be a positive integer`);
        }
      } else if (!hasText(finding[field])) {
        errors.push(`findings[${row}].${field} is required`);
      }
    }
  }

  for (const [index, item] of acCoverage.entries()) {
    const row = index + 1;
    if (!/^AC-\d{3,}$/i.test(String(item.acId || ""))) {
      errors.push(`acCoverage[${row}].acId must use AC-001 style`);
    }
    if (!AC_STATUSES.has(String(item.status || ""))) {
      errors.push(`acCoverage[${row}].status is invalid`);
    }
    if (!hasText(item.evidence)) {
      errors.push(`acCoverage[${row}].evidence is required`);
    }
  }

  for (const [index, command] of testsRun.entries()) {
    const row = index + 1;
    if (!hasText(command.command)) {
      errors.push(`tests.run[${row}].command is required`);
    }
    if (!COMMAND_STATUSES.has(String(command.status || ""))) {
      errors.push(`tests.run[${row}].status is invalid`);
    }
  }

  const p0 = findings.filter((item) => item.severity === "P0").length;
  const p1 = findings.filter((item) => item.severity === "P1").length;
  const p2 = findings.filter((item) => item.severity === "P2").length;
  const acFailed = acCoverage.filter((item) => item.status === "fail").length;
  const acUnknown = acCoverage.filter((item) => item.status === "unknown").length;
  const testsFailed = testsRun.filter((item) => item.status === "failed").length;
  const testsNotRun = testsRun.filter((item) => item.status === "not-run").length;
  const residualRisk = Boolean(review.residualRisk);

  if (p0 > 0) {
    blockers.push({ code: "P0_FINDINGS", count: p0 });
  }
  if (p1 > 0) {
    blockers.push({ code: "P1_FINDINGS", count: p1 });
  }
  if (acFailed > 0) {
    blockers.push({ code: "AC_FAILED", count: acFailed });
  }
  if (testsFailed > 0) {
    blockers.push({ code: "REVIEW_VALIDATION_FAILED", count: testsFailed });
  }
  if (errors.length > 0) {
    blockers.push({ code: "INVALID_REVIEW_REPORT", count: errors.length });
  }

  let gate = "ready";
  if (blockers.length > 0) {
    gate = "blocked";
  } else if (p2 > 0 || acUnknown > 0 || testsNotRun > 0 || residualRisk) {
    gate = "ready_with_concerns";
  }

  if (review.gate && review.gate !== gate) {
    errors.push(`gate must be '${gate}' for the recorded review`);
    blockers.push({ code: "GATE_MISMATCH", count: 1 });
  }

  const summary = {
    schemaVersion: 1,
    stage: "review-diff",
    gate: review.gate || gate,
    artifact: reviewPath,
    metrics: {
      p0,
      p1,
      p2,
      acFailed,
      acUnknown,
      testsFailed,
      testsNotRun,
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
  console.error(`review diff check failed: ${error.message}`);
  process.exit(1);
}
