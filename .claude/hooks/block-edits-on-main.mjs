// Claude Code hook: refuse to let Claude edit files in this repository while
// the checked-out branch is `main`.
//
// Why: every change is meant to go through the `cuicms-codebase-edit` skill
// (issue → branch → pull request). Claude decides for itself whether a request
// "matches" a skill, so a quick typo fix can skip it. Blocking edits on `main`
// makes skipping the workflow fail loudly instead of silently.
//
// Registered in .claude/settings.json. Claude Code passes the tool call as JSON
// on stdin; exiting with code 2 blocks the call and shows stderr to Claude.

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const input = JSON.parse(readFileSync(0, 'utf8'));
const filePath = input.tool_input?.file_path ?? input.tool_input?.notebook_path;
const projectDir = process.env.CLAUDE_PROJECT_DIR ?? input.cwd;

// Only guard files inside this repository. Claude also writes to places like
// its own memory folder, and those have nothing to do with `main`.
const relative = filePath ? path.relative(projectDir, path.resolve(projectDir, filePath)) : '';
if (!filePath || relative.startsWith('..') || path.isAbsolute(relative)) {
  process.exit(0);
}

let branch;
try {
  branch = execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
    cwd: projectDir,
    encoding: 'utf8',
  }).trim();
} catch {
  // Not a Git checkout, or Git is missing: nothing to protect.
  process.exit(0);
}

if (branch === 'main') {
  console.error(
    'Edits on `main` are blocked in this repository. Use the ' +
      '`cuicms-codebase-edit` skill: create an issue and a branch first, then ' +
      'make the change there.',
  );
  process.exit(2);
}
