#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const REQUIRED_SECTIONS = [
  "Scope",
  "Controlling Docs",
  "AC Evidence",
  "Changes",
  "Verification",
];

function usage() {
  console.error("Usage: check-request-log.mjs <request-log.md>");
}

function sectionBody(markdown, headingName) {
  const lines = markdown.split(/\r?\n/);
  let start = -1;
  let level = 0;
  const wanted = headingName.toLowerCase();

  for (let i = 0; i < lines.length; i += 1) {
    const match = lines[i].match(/^(#{1,6})\s+(.+?)\s*$/);
    if (match && match[2].trim().toLowerCase() === wanted) {
      start = i + 1;
      level = match[1].length;
      break;
    }
  }

  if (start === -1) return null;

  const body = [];
  for (let i = start; i < lines.length; i += 1) {
    const match = lines[i].match(/^(#{1,6})\s+/);
    if (match && match[1].length <= level) break;
    body.push(lines[i]);
  }
  return body.join("\n").trim();
}

function main() {
  const logPath = process.argv[2];
  if (!logPath) {
    usage();
    process.exit(2);
  }

  let markdown;
  try {
    markdown = fs.readFileSync(logPath, "utf8");
  } catch (error) {
    throw new Error(`Cannot read ${logPath}: ${error.message}`);
  }

  for (const section of REQUIRED_SECTIONS) {
    const body = sectionBody(markdown, section);
    if (body === null) {
      throw new Error(`Missing required section '${section}'.`);
    }
    if (!body.trim()) {
      throw new Error(`Required section '${section}' is empty.`);
    }
  }

  if (!/\|\s*AC ID\s*\|\s*Status\s*\|\s*Proof\s*\|/i.test(markdown)) {
    throw new Error("AC Evidence section must include a table with AC ID, Status, and Proof columns.");
  }

  console.log(`Request log ok: ${path.resolve(logPath)}`);
}

try {
  main();
} catch (error) {
  console.error(`Request log failed: ${error.message}`);
  process.exit(1);
}
