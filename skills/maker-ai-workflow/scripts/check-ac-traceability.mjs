#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const VALID_STATUSES = new Set(["pass", "blocked", "not-automatable", "deferred"]);

function usage() {
  console.error("Usage: check-ac-traceability.mjs <request-log.md> [--spec <spec.md>]");
}

function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch (error) {
    throw new Error(`Cannot read ${filePath}: ${error.message}`);
  }
}

function sectionBody(markdown, headingPattern) {
  const lines = markdown.split(/\r?\n/);
  let start = -1;
  let level = 0;

  for (let i = 0; i < lines.length; i += 1) {
    const match = lines[i].match(/^(#{1,6})\s+(.+?)\s*$/);
    if (match && headingPattern.test(match[2])) {
      start = i + 1;
      level = match[1].length;
      break;
    }
  }

  if (start === -1) return "";

  const body = [];
  for (let i = start; i < lines.length; i += 1) {
    const match = lines[i].match(/^(#{1,6})\s+/);
    if (match && match[1].length <= level) break;
    body.push(lines[i]);
  }
  return body.join("\n");
}

function parseMarkdownTable(section) {
  const rows = section
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|") && line.endsWith("|"));

  if (rows.length < 3) return { headers: [], records: [] };

  const headers = rows[0].split("|").slice(1, -1).map((cell) => cell.trim().toLowerCase());
  const records = [];

  for (const row of rows.slice(2)) {
    const cells = row.split("|").slice(1, -1).map((cell) => cell.trim());
    if (cells.every((cell) => /^:?-{3,}:?$/.test(cell))) continue;
    const record = {};
    headers.forEach((header, index) => {
      record[header] = cells[index] || "";
    });
    records.push(record);
  }

  return { headers, records };
}

function extractSpecAcIds(specMarkdown) {
  const acSection = sectionBody(specMarkdown, /^(acceptance criteria|ac)$/i);
  const source = acSection || specMarkdown;
  const ids = [];
  const lines = source.split(/\r?\n/);

  for (const line of lines) {
    const explicit = line.match(/\b(AC-\d{3,})\b/i);
    if (explicit) {
      ids.push(explicit[1].toUpperCase());
      continue;
    }
    if (/^\s*[-*]\s+\[[ xX]\]\s+/.test(line) || /^\s*[-*]\s+(Given|When|Then|Must|Should)\b/i.test(line)) {
      ids.push(`AC-${String(ids.length + 1).padStart(3, "0")}`);
    }
  }

  return [...new Set(ids)];
}

function main() {
  const args = process.argv.slice(2);
  const logPath = args[0];
  const specFlag = args.indexOf("--spec");
  const specPath = specFlag !== -1 ? args[specFlag + 1] : null;

  if (!logPath || (specFlag !== -1 && !specPath)) {
    usage();
    process.exit(2);
  }

  const markdown = readFile(logPath);
  const section = sectionBody(markdown, /^AC Evidence$/i);
  if (!section.trim()) {
    throw new Error("Missing required 'AC Evidence' section.");
  }

  const { headers, records } = parseMarkdownTable(section);
  const requiredHeaders = ["ac id", "status", "proof"];
  for (const header of requiredHeaders) {
    if (!headers.includes(header)) {
      throw new Error(`AC Evidence table must include '${header}'.`);
    }
  }

  if (records.length === 0) {
    throw new Error("AC Evidence table has no AC rows.");
  }

  const seen = new Set();
  for (const [index, record] of records.entries()) {
    const acId = record["ac id"];
    const status = (record.status || "").toLowerCase();
    const proof = record.proof || "";
    const notes = record.notes || "";

    if (!/^AC-\d{3,}$/i.test(acId)) {
      throw new Error(`Row ${index + 1} has invalid AC ID '${acId}'. Use AC-001 style IDs.`);
    }
    if (seen.has(acId.toUpperCase())) {
      throw new Error(`Duplicate AC ID '${acId}'.`);
    }
    seen.add(acId.toUpperCase());
    if (!VALID_STATUSES.has(status)) {
      throw new Error(`AC ${acId} has invalid status '${record.status}'.`);
    }
    if (!proof.trim()) {
      throw new Error(`AC ${acId} is missing proof.`);
    }
    if (status !== "pass" && !(proof + notes).trim()) {
      throw new Error(`AC ${acId} needs a reason for status '${status}'.`);
    }
  }

  if (specPath) {
    const specIds = extractSpecAcIds(readFile(specPath));
    const missing = specIds.filter((id) => !seen.has(id));
    if (missing.length > 0) {
      throw new Error(`Missing AC evidence for spec IDs: ${missing.join(", ")}`);
    }
  }

  console.log(`AC traceability ok: ${path.resolve(logPath)}`);
}

try {
  main();
} catch (error) {
  console.error(`AC traceability failed: ${error.message}`);
  process.exit(1);
}
