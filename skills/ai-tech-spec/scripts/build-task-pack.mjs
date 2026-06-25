#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const TECH_SPEC_FILE = "2-tech-spec.md";
const SOURCE_DOCS = [
  ["techSpec", TECH_SPEC_FILE, true],
  ["requirements", "1-requirements.md", false],
  ["feasibility", "0-feasibility-study.md", false],
];
const PATH_RE = /(?:^|[`(\s])((?:src|test|tests|docs|config|scripts)\/[A-Za-z0-9._*{}[\]/@-]+(?:\.[A-Za-z0-9]+)?)(?=$|[`),\s])/g;

function usage() {
  console.error(`Usage: build-task-pack.mjs <feature-dir|2-tech-spec.md> [--out <file>] [--format json|md] [--repo-root <dir>]

Examples:
  build-task-pack.mjs docs/features/market-price-alert/2-tech-spec.md
  build-task-pack.mjs docs/features/market-price-alert --out docs/features/market-price-alert/task-pack.json
  build-task-pack.mjs docs/features/market-price-alert --format md --out docs/features/market-price-alert/task-pack.md`);
}

function parseArgs(argv) {
  const options = {
    input: null,
    out: null,
    format: null,
    repoRoot: null,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--out") {
      options.out = argv[++i];
    } else if (arg === "--format") {
      options.format = argv[++i];
    } else if (arg === "--repo-root") {
      options.repoRoot = argv[++i];
    } else if (arg === "--help" || arg === "-h") {
      usage();
      process.exit(0);
    } else if (!options.input) {
      options.input = arg;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!options.input) {
    usage();
    process.exit(2);
  }

  if (options.format && !["json", "md"].includes(options.format)) {
    throw new Error("--format must be json or md.");
  }

  return options;
}

function resolveInput(input) {
  const resolved = path.resolve(input);
  const looksLikeMarkdown = path.extname(resolved).toLowerCase() === ".md";
  const techSpecPath = looksLikeMarkdown ? resolved : path.join(resolved, TECH_SPEC_FILE);
  const featureDir = looksLikeMarkdown ? path.dirname(resolved) : resolved;
  return { featureDir, techSpecPath };
}

function inferRepoRoot(techSpecPath) {
  const normalized = techSpecPath.split(path.sep);
  const docsIndex = normalized.lastIndexOf("docs");
  if (docsIndex !== -1 && normalized[docsIndex + 1] === "features") {
    const rootParts = normalized.slice(0, docsIndex);
    return rootParts.length > 0 ? rootParts.join(path.sep) || path.sep : path.sep;
  }
  return process.cwd();
}

function toRelative(filePath, repoRoot) {
  const relative = path.relative(repoRoot, filePath);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    return filePath;
  }
  return relative.split(path.sep).join("/");
}

function readIfExists(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, "utf8");
}

function slugifyHeading(text) {
  return text
    .toLowerCase()
    .replace(/`([^`]+)`/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function normalizeHeading(text) {
  return text
    .replace(/#+\s*$/, "")
    .replace(/`([^`]+)`/g, "$1")
    .trim()
    .toLowerCase();
}

function findSection(markdown, headingNames) {
  const wanted = new Set(headingNames.map(name => name.toLowerCase()));
  const lines = markdown.split(/\r?\n/);

  for (let i = 0; i < lines.length; i += 1) {
    const match = lines[i].match(/^(#{1,6})\s+(.+?)\s*$/);
    if (!match) continue;

    const heading = normalizeHeading(match[2]);
    if (!wanted.has(heading)) continue;

    const level = match[1].length;
    const body = [];
    for (let j = i + 1; j < lines.length; j += 1) {
      const next = lines[j].match(/^(#{1,6})\s+/);
      if (next && next[1].length <= level) break;
      body.push(lines[j]);
    }

    return {
      heading: match[2].trim(),
      anchor: slugifyHeading(match[2]),
      body: body.join("\n"),
    };
  }

  return null;
}

function stripCheckbox(text) {
  return text.replace(/^\[[ xX]\]\s+/, "").trim();
}

function stripMarkdown(text) {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .trim();
}

function cleanEntryText(text) {
  return stripMarkdown(text)
    .replace(/\s+/g, " ")
    .trim();
}

function removeIdFromText(text, id) {
  if (!id) return cleanEntryText(text);
  const escaped = id.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
  return cleanEntryText(
    text.replace(new RegExp(`^\\s*(?:\\*\\*)?${escaped}(?:\\*\\*)?\\s*[:\\-.)]?\\s*`, "i"), "")
  );
}

function parseTableEntries(sectionBody) {
  const lines = sectionBody.split(/\r?\n/);
  const entries = [];

  for (let i = 0; i < lines.length - 1; i += 1) {
    const headerLine = lines[i].trim();
    const separatorLine = lines[i + 1].trim();
    if (!headerLine.startsWith("|") || !separatorLine.startsWith("|")) continue;
    if (!/\|?\s*:?-{3,}:?\s*(\||$)/.test(separatorLine)) continue;

    const headers = headerLine
      .split("|")
      .slice(1, -1)
      .map(cell => normalizeHeading(cell));
    const idIndex = headers.findIndex(header => ["id", "ac id", "ac"].includes(header));
    const textIndex = headers.findIndex(header =>
      ["text", "criteria", "criterion", "acceptance criteria", "description"].includes(header)
    );
    if (idIndex === -1 && textIndex === -1) continue;

    for (let j = i + 2; j < lines.length; j += 1) {
      const row = lines[j].trim();
      if (!row.startsWith("|")) break;
      const cells = row.split("|").slice(1, -1).map(cell => cell.trim());
      if (cells.every(cell => /^:?-{3,}:?$/.test(cell))) continue;
      const rawId = idIndex === -1 ? "" : stripMarkdown(cells[idIndex] || "");
      const rawText = textIndex === -1 ? cells.join(" ") : cells[textIndex] || "";
      entries.push({
        raw: cleanEntryText(cells.join(" ")),
        id: extractAcId(rawId) || extractAcId(rawText),
        text: removeIdFromText(rawText, extractAcId(rawId) || extractAcId(rawText)),
      });
    }
  }

  return entries;
}

function parseListEntries(sectionBody) {
  const lines = sectionBody.split(/\r?\n/);
  const entries = [];
  let current = null;

  function flush() {
    if (!current) return;
    const raw = cleanEntryText(current.join(" "));
    if (raw) {
      const id = extractAcId(raw);
      entries.push({ raw, id, text: removeIdFromText(raw, id) });
    }
    current = null;
  }

  for (const line of lines) {
    const item = line.match(/^\s*(?:[-*+]|\d+[.)])\s+(.*)$/);
    const headingItem = line.match(/^\s*#{3,6}\s+(AC-\d{3,}\b.*)$/i);

    if (item || headingItem) {
      flush();
      current = [stripCheckbox((item ? item[1] : headingItem[1]).trim())];
      continue;
    }

    if (current && line.trim() && !line.trim().startsWith("|")) {
      current.push(line.trim());
    }
  }

  flush();
  return entries;
}

function parsePlainEntries(sectionBody) {
  const text = cleanEntryText(
    sectionBody
      .split(/\r?\n/)
      .filter(line => line.trim() && !line.trim().startsWith("|"))
      .join(" ")
  );
  if (!text) return [];
  const id = extractAcId(text);
  return [{ raw: text, id, text: removeIdFromText(text, id) }];
}

function extractAcId(text) {
  const match = text.match(/\bAC-\d{3,}\b/i);
  return match ? match[0].toUpperCase() : null;
}

function parseAcceptanceCriteria(section, source) {
  const tableEntries = parseTableEntries(section.body);
  const listEntries = parseListEntries(section.body);
  const entries = tableEntries.length > 0 ? tableEntries : listEntries;
  const parsed = entries.length > 0 ? entries : parsePlainEntries(section.body);

  return parsed.map(entry => ({
    id: entry.id,
    text: entry.text,
    source,
    raw: entry.raw,
  }));
}

function parseNonGoals(section, source) {
  if (!section) return [];
  const entries = parseListEntries(section.body);
  const parsed = entries.length > 0 ? entries : parsePlainEntries(section.body);
  return parsed
    .map(entry => cleanEntryText(entry.text || entry.raw))
    .filter(Boolean)
    .map(text => ({ text, source }));
}

function isSectionEmpty(sectionBody) {
  return !sectionBody
    .replace(/<!--[\s\S]*?-->/g, "")
    .split(/\r?\n/)
    .some(line => {
      const trimmed = line.trim();
      return trimmed && !/^[-*+]\s*$/.test(trimmed) && !/^\|?\s*:?-{3,}:?\s*(\||$)/.test(trimmed);
    });
}

function collectGateIssues({ techSpecExists, acSection, acceptanceCriteria, acBody }) {
  const issues = [];

  if (!techSpecExists) {
    return [
      {
        code: "tech_spec_missing",
        message: `${TECH_SPEC_FILE} was not found.`,
      },
    ];
  }

  if (!acSection) {
    return [
      {
        code: "acceptance_criteria_missing",
        message: "Missing Acceptance Criteria section.",
      },
    ];
  }

  if (isSectionEmpty(acBody)) {
    return [
      {
        code: "acceptance_criteria_empty",
        message: "Acceptance Criteria section is empty.",
      },
    ];
  }

  const seen = new Map();
  for (const [index, ac] of acceptanceCriteria.entries()) {
    const row = index + 1;
    if (!ac.id) {
      issues.push({
        code: "acceptance_criteria_missing_id",
        message: `Acceptance criterion ${row} is missing a stable AC ID.`,
        source: ac.source,
      });
      continue;
    }

    if (seen.has(ac.id)) {
      issues.push({
        code: "acceptance_criteria_duplicate_id",
        message: `Duplicate acceptance criterion ID: ${ac.id}.`,
        source: ac.source,
      });
    }
    seen.set(ac.id, true);

    if (!ac.text) {
      issues.push({
        code: "acceptance_criteria_empty_text",
        message: `${ac.id} has an ID but no acceptance criterion text.`,
        source: ac.source,
      });
    }
  }

  return issues;
}

function findRepoInstructions(featureDir, repoRoot) {
  const files = [];
  let current = featureDir;
  const root = path.resolve(repoRoot);

  while (current.startsWith(root)) {
    const candidate = path.join(current, "AGENTS.md");
    if (fs.existsSync(candidate)) files.push(candidate);
    if (current === root) break;
    const next = path.dirname(current);
    if (next === current) break;
    current = next;
  }

  return files.reverse();
}

function collectRelevantFiles(markdowns, repoRoot) {
  const files = new Map();

  for (const { role, path: docPath, markdown } of markdowns) {
    if (!markdown) continue;
    for (const match of markdown.matchAll(PATH_RE)) {
      const filePath = match[1].replace(/[.;:]$/, "");
      if (!files.has(filePath)) {
        files.set(filePath, {
          path: filePath,
          source: `${toRelative(docPath, repoRoot)}#${role}`,
        });
      }
    }
  }

  return [...files.values()].sort((a, b) => a.path.localeCompare(b.path));
}

function buildTaskPack(options) {
  const { featureDir, techSpecPath } = resolveInput(options.input);
  const repoRoot = path.resolve(options.repoRoot || inferRepoRoot(techSpecPath));
  const feature = path.basename(featureDir);
  const techSpecRel = toRelative(techSpecPath, repoRoot);
  const techSpecMarkdown = readIfExists(techSpecPath);
  const techSpecExists = techSpecMarkdown !== null;

  const sourceDocs = SOURCE_DOCS.map(([role, filename, required]) => ({
    role,
    path: toRelative(path.join(featureDir, filename), repoRoot),
    required,
  }));

  const markdowns = SOURCE_DOCS.map(([role, filename]) => {
    const docPath = path.join(featureDir, filename);
    return { role, path: docPath, markdown: readIfExists(docPath) };
  });

  const acSection = techSpecExists
    ? findSection(techSpecMarkdown, ["Acceptance Criteria", "AC"])
    : null;
  const nonGoalsSection = techSpecExists ? findSection(techSpecMarkdown, ["Non-goals", "Non goals"]) : null;
  const acSource = acSection ? `${techSpecRel}#${acSection.anchor}` : `${techSpecRel}#acceptance-criteria`;
  const acceptanceCriteria = acSection
    ? parseAcceptanceCriteria(acSection, acSource).map(({ raw, ...ac }) => ac)
    : [];
  const nonGoals = parseNonGoals(
    nonGoalsSection,
    nonGoalsSection ? `${techSpecRel}#${nonGoalsSection.anchor}` : `${techSpecRel}#non-goals`
  );
  const gateIssues = collectGateIssues({
    techSpecExists,
    acSection,
    acceptanceCriteria,
    acBody: acSection ? acSection.body : "",
  });

  return {
    schemaVersion: 1,
    feature,
    generatedAt: new Date().toISOString(),
    sourceDocs,
    repoInstructions: findRepoInstructions(featureDir, repoRoot).map(filePath => ({
      path: toRelative(filePath, repoRoot),
    })),
    relevantFiles: collectRelevantFiles(markdowns, repoRoot),
    acceptanceCriteria,
    nonGoals,
    gate: {
      status: gateIssues.length > 0 ? "blocked" : "ready",
      issues: gateIssues,
    },
  };
}

function renderMarkdown(pack) {
  const lines = [
    `# Task Pack: ${pack.feature}`,
    "",
    `Generated: ${pack.generatedAt}`,
    "",
    "## Gate",
    "",
    `Status: ${pack.gate.status}`,
    "",
  ];

  if (pack.gate.issues.length > 0) {
    for (const issue of pack.gate.issues) {
      lines.push(`- ${issue.code}: ${issue.message}`);
    }
    lines.push("");
  }

  lines.push("## Source Docs", "");
  for (const doc of pack.sourceDocs) {
    lines.push(`- ${doc.role}: ${doc.path}${doc.required ? " (required)" : ""}`);
  }

  if (pack.repoInstructions.length > 0) {
    lines.push("", "## Repo Instructions", "");
    for (const instruction of pack.repoInstructions) {
      lines.push(`- ${instruction.path}`);
    }
  }

  if (pack.relevantFiles.length > 0) {
    lines.push("", "## Relevant Files", "");
    for (const file of pack.relevantFiles) {
      lines.push(`- ${file.path} (${file.source})`);
    }
  }

  lines.push("", "## Acceptance Criteria", "");
  if (pack.acceptanceCriteria.length === 0) {
    lines.push("- None parsed.");
  } else {
    for (const ac of pack.acceptanceCriteria) {
      lines.push(`- ${ac.id || "MISSING-ID"}: ${ac.text || "MISSING-TEXT"}`);
    }
  }

  lines.push("", "## Non-goals", "");
  if (pack.nonGoals.length === 0) {
    lines.push("- None parsed.");
  } else {
    for (const nonGoal of pack.nonGoals) {
      lines.push(`- ${nonGoal.text}`);
    }
  }

  return `${lines.join("\n")}\n`;
}

function writeOutput(pack, options) {
  const format = options.format || (options.out && options.out.endsWith(".md") ? "md" : "json");
  const output = format === "md" ? renderMarkdown(pack) : `${JSON.stringify(pack, null, 2)}\n`;

  if (options.out) {
    fs.writeFileSync(options.out, output);
    return;
  }

  process.stdout.write(output);
}

try {
  const options = parseArgs(process.argv.slice(2));
  const pack = buildTaskPack(options);
  writeOutput(pack, options);
  process.exit(pack.gate.status === "blocked" ? 1 : 0);
} catch (error) {
  console.error(`build-task-pack failed: ${error.message}`);
  process.exit(1);
}
