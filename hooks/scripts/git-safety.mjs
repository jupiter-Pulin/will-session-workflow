#!/usr/bin/env node
import fs from "node:fs";

// PreToolUse guard for Bash: allow local commits, deny remote-mutating git
// operations (push) and irreversible local ones (reset --hard, clean -f,
// checkout -- <path>, restore of the worktree, branch -D, stash drop/clear,
// filter-branch, reflog expire, update-ref -d, worktree remove --force).
//
// This is a guardrail against agent mistakes, not a security boundary: the
// deny message asks the model to hand the command back to the user.

// Git global options whose value is a separate token (git -C <dir> push).
const OPTIONS_WITH_VALUE = new Set(["-C", "-c", "--git-dir", "--work-tree", "--namespace", "--exec-path"]);

function gitInvocation(segment) {
  const tokens = segment.trim().split(/\s+/);
  const gitIndex = tokens.findIndex((token) => token === "git" || token.endsWith("/git"));
  if (gitIndex === -1) return null;

  let index = gitIndex + 1;
  while (index < tokens.length) {
    const token = tokens[index];
    if (OPTIONS_WITH_VALUE.has(token)) {
      index += 2;
    } else if (token.startsWith("-")) {
      index += 1;
    } else {
      break;
    }
  }
  if (index >= tokens.length) return null;
  return { subcommand: tokens[index], rest: tokens.slice(index + 1) };
}

function judge({ subcommand, rest }) {
  const restText = rest.join(" ");
  const hasForceFlag = rest.some((token) => token === "--force" || /^-[a-zA-Z]*f/.test(token));

  switch (subcommand) {
    case "push":
      return "git push (remote-mutating; includes --force variants)";
    case "reset":
      return restText.includes("--hard") ? "git reset --hard (discards local changes)" : null;
    case "clean":
      return hasForceFlag ? "git clean -f (deletes untracked files)" : null;
    case "checkout":
      return rest.includes("--") || rest.includes(".")
        ? "git checkout -- <path> / git checkout . (discards worktree changes)"
        : null;
    case "restore": {
      const staged = rest.includes("--staged") || rest.some((token) => /^-[a-zA-Z]*S/.test(token));
      const worktree = rest.includes("--worktree") || rest.some((token) => /^-[a-zA-Z]*W/.test(token));
      return staged && !worktree ? null : "git restore (discards worktree changes; only --staged is allowed)";
    }
    case "branch":
      return rest.some((token) => /^-[a-zA-Z]*D/.test(token)) ||
        (rest.includes("--delete") && rest.includes("--force"))
        ? "git branch -D (force-deletes a branch)"
        : null;
    case "stash":
      return rest[0] === "drop" || rest[0] === "clear" ? "git stash drop/clear (destroys stashed work)" : null;
    case "filter-branch":
      return "git filter-branch (rewrites history)";
    case "reflog":
      return rest[0] === "expire" ? "git reflog expire (destroys recovery points)" : null;
    case "update-ref":
      return rest.includes("-d") || rest.includes("--delete") ? "git update-ref -d (deletes a ref)" : null;
    case "worktree":
      return rest[0] === "remove" && hasForceFlag
        ? "git worktree remove --force (may destroy uncommitted work)"
        : null;
    default:
      return null;
  }
}

function stripQuoted(command) {
  // Drop quoted spans so commit messages like -m "do not git push" cannot
  // false-positive. Quoted payloads of sh -c are analyzed separately below.
  return command.replace(/'[^']*'/g, " ").replace(/"[^"]*"/g, " ");
}

function quotedContents(command) {
  const contents = [];
  for (const match of command.matchAll(/'([^']*)'|"([^"]*)"/g)) {
    contents.push(match[1] ?? match[2] ?? "");
  }
  return contents;
}

function findDanger(command) {
  let segments = stripQuoted(command).split(/[;|&\n]+/);
  if (/\b(?:sh|bash|zsh|dash)\s+(?:-[A-Za-z]+\s+)*-c\b/.test(command)) {
    segments = segments.concat(quotedContents(command).flatMap((inner) => inner.split(/[;|&\n]+/)));
  }

  for (const segment of segments) {
    const invocation = gitInvocation(segment);
    if (!invocation) continue;
    const danger = judge(invocation);
    if (danger) return danger;
  }
  return null;
}

function main() {
  let payload;
  try {
    payload = JSON.parse(fs.readFileSync(0, "utf8"));
  } catch {
    process.exit(0);
  }

  if (payload.tool_name !== "Bash") process.exit(0);
  const command = String(payload.tool_input?.command || "");
  if (!command) process.exit(0);

  const danger = findDanger(command);
  if (!danger) process.exit(0);

  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason:
          `session-workflow git-safety hook blocked: ${danger}. ` +
          "Local commits are allowed, but pushing to a remote and irreversible history/worktree operations are reserved for the user. " +
          "Ask the user to run this command themselves or to explicitly approve it.",
      },
    })
  );
  process.exit(0);
}

main();
