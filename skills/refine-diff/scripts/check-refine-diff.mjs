#!/usr/bin/env node
import fs from "node:fs";

const GATES = new Set(["no_changes", "changes_required", "blocked"]);
const IMPACTS = new Set(["High", "Medium", "Low"]);

function usage() {
  console.error("Usage: check-refine-diff.mjs --refine <file>");
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

function validateLocatedItem(errors, collection, item, index, requiredFields) {
  const row = index + 1;
  if (!hasText(item.file)) {
    errors.push(`${collection}[${row}].file is required`);
  }
  if (!Number.isInteger(item.line) || item.line < 1) {
    errors.push(`${collection}[${row}].line must be a positive integer`);
  }
  for (const field of requiredFields) {
    if (!hasText(item[field])) {
      errors.push(`${collection}[${row}].${field} is required`);
    }
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const refinePath = options.refine;

  if (!refinePath) {
    usage();
    process.exit(2);
  }

  const report = readJson(refinePath);
  const opportunities = asArray(report.opportunities);
  const keep = asArray(report.keep);
  const blockers = asArray(report.blockers);
  const errors = [];

  if (report.schemaVersion !== 1) {
    errors.push("schemaVersion must be 1");
  }
  if (report.stage !== "refine-diff") {
    errors.push("stage must be 'refine-diff'");
  }
  if (!GATES.has(report.gate)) {
    errors.push("gate must be 'no_changes', 'changes_required', or 'blocked'");
  }

  for (const [index, opportunity] of opportunities.entries()) {
    const row = index + 1;
    if (!IMPACTS.has(String(opportunity.impact || ""))) {
      errors.push(`opportunities[${row}].impact must be High, Medium, or Low`);
    }
    validateLocatedItem(errors, "opportunities", opportunity, index, [
      "title",
      "payoff",
      "evidence",
      "suggestion",
      "safety",
    ]);
  }

  for (const [index, item] of keep.entries()) {
    validateLocatedItem(errors, "keep", item, index, ["reason"]);
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

  let gate = "no_changes";
  if (blockers.length > 0 || errors.length > 0) {
    gate = "blocked";
  } else if (opportunities.length > 0) {
    gate = "changes_required";
  }

  if (report.gate && report.gate !== gate) {
    errors.push(`gate must be '${gate}' for the recorded refinement report`);
  }

  const summary = {
    schemaVersion: 1,
    stage: "refine-diff",
    gate: report.gate || gate,
    artifact: refinePath,
    metrics: {
      high: opportunities.filter((item) => item.impact === "High").length,
      medium: opportunities.filter((item) => item.impact === "Medium").length,
      low: opportunities.filter((item) => item.impact === "Low").length,
      opportunities: opportunities.length,
      keep: keep.length,
      blockers: blockers.length,
      errors: errors.length,
    },
    blockers:
      blockers.length > 0
        ? blockers
        : errors.length > 0
          ? [{ code: "INVALID_REFINE_REPORT", count: errors.length }]
          : [],
    errors,
  };

  console.log(JSON.stringify(summary, null, 2));

  process.exit(errors.length === 0 && gate !== "blocked" ? 0 : 1);
}

try {
  main();
} catch (error) {
  console.error(`refine diff check failed: ${error.message}`);
  process.exit(1);
}
