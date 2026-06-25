#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const SCHEMA_VERSION = 1;

const STATES = new Set([
  "initialized",
  "task-pack",
  "maker",
  "maker-self-check",
  "review-diff",
  "review-fix",
  "refine-diff",
  "refine-apply",
  "post-refine-check",
  "handoff",
  "done",
]);

const STATUSES = new Set(["running", "passed", "blocked", "failed", "done"]);

const DEFAULT_NEXT = {
  initialized: "task-pack",
  "task-pack": "maker",
  maker: "maker-self-check",
  "maker-self-check": "review-diff",
  "review-diff": "refine-diff",
  "review-fix": "review-diff",
  "refine-diff": "refine-apply",
  "refine-apply": "post-refine-check",
  "post-refine-check": "handoff",
  handoff: "done",
  done: null,
};

const BLOCKED_NEXT = {
  "review-diff": "review-fix",
  "post-refine-check": "refine-apply",
};

function usage() {
  console.error(`Usage:
  run-state.mjs init <feature-dir|2-tech-spec.md> [--run-dir <dir>] [--task-pack <file>] [--request-log <file>] [--force]
  run-state.mjs status <run-dir|run-state.json>
  run-state.mjs next <run-dir|run-state.json>
  run-state.mjs refresh <run-dir|run-state.json>
  run-state.mjs enter <run-dir|run-state.json> <state> [--artifact <file>] [--note <text>]
  run-state.mjs pass <run-dir|run-state.json> <state> [--artifact <file>] [--gate <value>] [--next <state>] [--note <text>]
  run-state.mjs block <run-dir|run-state.json> <state> [--artifact <file>] [--reason <text>]
  run-state.mjs attach <run-dir|run-state.json> <kind> <file>
  run-state.mjs check <run-dir|run-state.json>`);
}

function parseArgs(argv) {
  const positionals = [];
  const options = { artifacts: [] };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) {
      positionals.push(arg);
      continue;
    }

    const key = arg.slice(2);
    if (key === "force") {
      options.force = true;
      continue;
    }

    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for --${key}`);
    }
    index += 1;

    if (key === "artifact") {
      options.artifacts.push(value);
    } else {
      options[key] = value;
    }
  }

  return { positionals, options };
}

function now() {
  return new Date().toISOString();
}

function compactTimestamp() {
  return now().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function sanitizeName(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function runGit(cwd, args) {
  const result = spawnSync("git", args, {
    cwd,
    encoding: "utf8",
  });

  if (result.status !== 0) {
    return null;
  }

  return result.stdout.trim();
}

function findRepoRoot(cwd) {
  return runGit(cwd, ["rev-parse", "--show-toplevel"]) || cwd;
}

function collectRepo(repoRoot, existingRepo = {}) {
  const head = runGit(repoRoot, ["rev-parse", "HEAD"]);
  const branch = runGit(repoRoot, ["branch", "--show-current"]) || null;
  const dirty = Boolean(runGit(repoRoot, ["status", "--porcelain"]));

  return {
    root: repoRoot,
    branch,
    startHead: existingRepo.startHead ?? head,
    currentHead: head,
    dirtyAtStart: existingRepo.dirtyAtStart ?? dirty,
    dirtyNow: dirty,
  };
}

function sha256(filePath) {
  return createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function toDisplayPath(filePath, repoRoot) {
  const absolute = path.resolve(filePath);
  const relative = path.relative(repoRoot, absolute);
  if (!relative.startsWith("..") && !path.isAbsolute(relative)) {
    return relative || ".";
  }
  return absolute;
}

function resolveDisplayPath(displayPath, repoRoot) {
  if (path.isAbsolute(displayPath)) return displayPath;
  return path.resolve(repoRoot, displayPath);
}

function fileRecord(filePath, repoRoot) {
  const absolute = path.resolve(filePath);
  if (!fs.existsSync(absolute)) {
    throw new Error(`File does not exist: ${filePath}`);
  }
  if (!fs.statSync(absolute).isFile()) {
    throw new Error(`Path is not a file: ${filePath}`);
  }
  return {
    path: toDisplayPath(absolute, repoRoot),
    sha256: sha256(absolute),
  };
}

function artifactRecord(kind, filePath, repoRoot, state) {
  return {
    kind,
    ...fileRecord(filePath, repoRoot),
    state,
    recordedAt: now(),
  };
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tmp = `${filePath}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(value, null, 2)}\n`);
  fs.renameSync(tmp, filePath);
}

function resolveRunStatePath(input) {
  const absolute = path.resolve(input);
  if (fs.existsSync(absolute) && fs.statSync(absolute).isFile()) {
    return absolute;
  }
  return path.join(absolute, "run-state.json");
}

function loadRun(input) {
  const statePath = resolveRunStatePath(input);
  if (!fs.existsSync(statePath)) {
    throw new Error(`Cannot find run-state.json at ${statePath}`);
  }
  return { statePath, run: JSON.parse(fs.readFileSync(statePath, "utf8")) };
}

function saveRun(statePath, run) {
  run.updatedAt = now();
  run.repo = collectRepo(run.repo.root, run.repo);
  writeJson(statePath, run);
}

function assertState(state) {
  if (!STATES.has(state)) {
    throw new Error(`Invalid state '${state}'. Allowed states: ${[...STATES].join(", ")}`);
  }
}

function assertStatus(status) {
  if (!STATUSES.has(status)) {
    throw new Error(`Invalid status '${status}'. Allowed statuses: ${[...STATUSES].join(", ")}`);
  }
}

function nextAfterPass(state, override) {
  if (override) {
    assertState(override);
    return override;
  }
  return DEFAULT_NEXT[state] ?? null;
}

function nextAfterBlock(state) {
  return BLOCKED_NEXT[state] || state;
}

function pushArtifact(run, kind, filePath, state) {
  const record = artifactRecord(kind, filePath, run.repo.root, state);
  const index = run.artifacts.findIndex(
    (item) => item.kind === record.kind && item.path === record.path
  );
  if (index === -1) {
    run.artifacts.push(record);
  } else {
    run.artifacts[index] = record;
  }
  return record;
}

function findArtifactByPath(run, filePath) {
  const displayPath = toDisplayPath(path.resolve(filePath), run.repo.root);
  return run.artifacts.find((item) => item.path === displayPath) || null;
}

function attachTransitionArtifacts(run, artifacts, state) {
  return artifacts.map(
    (artifact) => findArtifactByPath(run, artifact) || pushArtifact(run, "other", artifact, state)
  );
}

function resolveTechSpec(input) {
  const absolute = path.resolve(input);
  if (!fs.existsSync(absolute)) {
    throw new Error(`Input does not exist: ${input}`);
  }

  const stat = fs.statSync(absolute);
  const techSpec = stat.isDirectory() ? path.join(absolute, "2-tech-spec.md") : absolute;
  if (!fs.existsSync(techSpec)) {
    throw new Error(`Missing tech spec: ${techSpec}`);
  }
  if (path.basename(techSpec) !== "2-tech-spec.md") {
    throw new Error(`Expected a feature directory or 2-tech-spec.md, got: ${input}`);
  }
  return techSpec;
}

function commandInit(args, options) {
  const input = args[0];
  if (!input) {
    usage();
    process.exit(2);
  }

  const techSpec = resolveTechSpec(input);
  const featureDir = path.dirname(techSpec);
  const feature = sanitizeName(path.basename(featureDir));
  const repoRoot = findRepoRoot(process.cwd());
  const runId = `${compactTimestamp()}-${feature}`;
  const runDir = path.resolve(options["run-dir"] || path.join(repoRoot, ".agent-runs", runId));
  const statePath = path.join(runDir, "run-state.json");

  if (fs.existsSync(statePath) && !options.force) {
    throw new Error(`Run state already exists: ${statePath}. Use --force to overwrite.`);
  }

  fs.mkdirSync(runDir, { recursive: true });
  const repo = collectRepo(repoRoot);
  const createdAt = now();
  const run = {
    schemaVersion: SCHEMA_VERSION,
    runId: path.basename(runDir),
    feature,
    runDir: toDisplayPath(runDir, repoRoot),
    createdAt,
    updatedAt: createdAt,
    inputs: {
      featureDir: toDisplayPath(featureDir, repoRoot),
      techSpec: fileRecord(techSpec, repoRoot),
    },
    repo,
    state: {
      current: "initialized",
      status: "running",
      attempt: 0,
      nextRequired: "task-pack",
    },
    attempts: {},
    gates: {},
    artifacts: [],
    transitions: [],
    blockers: [],
  };

  if (options["task-pack"]) {
    pushArtifact(run, "task-pack", options["task-pack"], "task-pack");
  }
  if (options["request-log"]) {
    pushArtifact(run, "request-log", options["request-log"], "maker-self-check");
  }

  writeJson(statePath, run);
  console.log(statePath);
}

function commandStatus(input) {
  const { run } = loadRun(input);
  console.log(
    JSON.stringify(
      {
        runId: run.runId,
        feature: run.feature,
        runDir: run.runDir,
        current: run.state.current,
        status: run.state.status,
        nextRequired: run.state.nextRequired,
        currentHead: run.repo.currentHead,
        dirtyNow: run.repo.dirtyNow,
        artifactCount: run.artifacts.length,
        blockerCount: run.blockers.length,
      },
      null,
      2
    )
  );
}

function commandNext(input) {
  const { run } = loadRun(input);
  console.log(run.state.nextRequired || "none");
}

function commandRefresh(input) {
  const { statePath, run } = loadRun(input);
  saveRun(statePath, run);
  commandStatus(statePath);
}

function commandEnter(input, state, options) {
  assertState(state);
  const { statePath, run } = loadRun(input);
  run.attempts[state] = (run.attempts[state] || 0) + 1;
  const head = runGit(run.repo.root, ["rev-parse", "HEAD"]);
  const records = attachTransitionArtifacts(run, options.artifacts, state);
  run.transitions.push({
    action: "enter",
    from: run.state.current,
    to: state,
    status: "running",
    at: now(),
    head,
    attempt: run.attempts[state],
    artifacts: records.map((record) => record.path),
    note: options.note || "",
  });
  run.state = {
    current: state,
    status: "running",
    attempt: run.attempts[state],
    nextRequired: state,
  };
  saveRun(statePath, run);
  commandStatus(statePath);
}

function commandPass(input, state, options) {
  assertState(state);
  const { statePath, run } = loadRun(input);
  const nextRequired = nextAfterPass(state, options.next);
  const status = nextRequired === null || nextRequired === "done" ? "done" : "passed";
  const head = runGit(run.repo.root, ["rev-parse", "HEAD"]);
  const records = attachTransitionArtifacts(run, options.artifacts, state);

  if (options.gate) {
    run.gates[state] = options.gate;
  }

  run.transitions.push({
    action: "pass",
    from: run.state.current,
    to: state,
    status,
    gate: options.gate || "",
    at: now(),
    head,
    artifacts: records.map((record) => record.path),
    note: options.note || "",
    nextRequired,
  });
  run.state = {
    current: state,
    status,
    attempt: run.attempts[state] || run.state.attempt || 0,
    nextRequired,
  };

  if (nextRequired === "done") {
    run.state.current = "done";
    run.state.status = "done";
    run.state.nextRequired = null;
  }

  saveRun(statePath, run);
  commandStatus(statePath);
}

function commandBlock(input, state, options) {
  assertState(state);
  const { statePath, run } = loadRun(input);
  const nextRequired = nextAfterBlock(state);
  const head = runGit(run.repo.root, ["rev-parse", "HEAD"]);
  const records = attachTransitionArtifacts(run, options.artifacts, state);
  const blocker = {
    state,
    reason: options.reason || "",
    at: now(),
    head,
    artifacts: records.map((record) => record.path),
    nextRequired,
  };

  run.blockers.push(blocker);
  run.transitions.push({
    action: "block",
    from: run.state.current,
    to: state,
    status: "blocked",
    at: blocker.at,
    head,
    artifacts: blocker.artifacts,
    reason: blocker.reason,
    nextRequired,
  });
  run.state = {
    current: state,
    status: "blocked",
    attempt: run.attempts[state] || run.state.attempt || 0,
    nextRequired,
  };
  saveRun(statePath, run);
  commandStatus(statePath);
}

function commandAttach(input, kind, filePath) {
  if (!kind || !filePath) {
    usage();
    process.exit(2);
  }
  const { statePath, run } = loadRun(input);
  const record = pushArtifact(run, kind, filePath, run.state.current);
  run.transitions.push({
    action: "attach",
    state: run.state.current,
    status: run.state.status,
    kind,
    artifact: record.path,
    at: now(),
    head: runGit(run.repo.root, ["rev-parse", "HEAD"]),
  });
  saveRun(statePath, run);
  console.log(JSON.stringify(record, null, 2));
}

function checkFileHash(label, record, repoRoot, errors) {
  const absolute = resolveDisplayPath(record.path, repoRoot);
  if (!fs.existsSync(absolute)) {
    errors.push(`${label} missing: ${record.path}`);
    return;
  }
  const actual = sha256(absolute);
  if (actual !== record.sha256) {
    errors.push(`${label} hash mismatch: ${record.path}`);
  }
}

function commandCheck(input) {
  const { run } = loadRun(input);
  const errors = [];

  if (run.schemaVersion !== SCHEMA_VERSION) {
    errors.push(`Unsupported schemaVersion: ${run.schemaVersion}`);
  }
  if (!run.runId) errors.push("Missing runId");
  if (!run.feature) errors.push("Missing feature");
  if (!run.inputs?.techSpec) errors.push("Missing inputs.techSpec");
  if (!run.repo?.root) errors.push("Missing repo.root");
  if (!run.state?.current) errors.push("Missing state.current");
  if (run.state?.current && !STATES.has(run.state.current)) {
    errors.push(`Invalid state.current: ${run.state.current}`);
  }
  if (run.state?.nextRequired && !STATES.has(run.state.nextRequired)) {
    errors.push(`Invalid state.nextRequired: ${run.state.nextRequired}`);
  }
  if (run.state?.status && !STATUSES.has(run.state.status)) {
    errors.push(`Invalid state.status: ${run.state.status}`);
  }

  if (run.inputs?.techSpec) {
    checkFileHash("techSpec", run.inputs.techSpec, run.repo.root, errors);
  }

  for (const artifact of run.artifacts || []) {
    if (!artifact.kind) errors.push(`Artifact missing kind: ${artifact.path || "<unknown>"}`);
    if (!artifact.path) errors.push(`Artifact missing path for kind: ${artifact.kind || "<unknown>"}`);
    if (artifact.path && artifact.sha256) {
      checkFileHash(`artifact ${artifact.kind}`, artifact, run.repo.root, errors);
    }
  }

  if (errors.length > 0) {
    for (const error of errors) {
      console.error(`run-state check failed: ${error}`);
    }
    process.exit(1);
  }

  console.log(`run-state ok: ${run.runId}`);
}

function main() {
  const [command, ...rest] = process.argv.slice(2);
  if (!command) {
    usage();
    process.exit(2);
  }

  const { positionals, options } = parseArgs(rest);

  if (command === "init") {
    commandInit(positionals, options);
  } else if (command === "status") {
    commandStatus(positionals[0]);
  } else if (command === "next") {
    commandNext(positionals[0]);
  } else if (command === "refresh") {
    commandRefresh(positionals[0]);
  } else if (command === "enter") {
    commandEnter(positionals[0], positionals[1], options);
  } else if (command === "pass") {
    commandPass(positionals[0], positionals[1], options);
  } else if (command === "block") {
    commandBlock(positionals[0], positionals[1], options);
  } else if (command === "attach") {
    commandAttach(positionals[0], positionals[1], positionals[2]);
  } else if (command === "check") {
    commandCheck(positionals[0]);
  } else {
    usage();
    process.exit(2);
  }
}

try {
  main();
} catch (error) {
  console.error(`run-state failed: ${error.message}`);
  process.exit(1);
}
