---
name: cuicms-codebase-edit
description: Use when making any change — code, content, or config — to the cambridge-indian-classical-music.github.io repo (CUICMS website), however small.
---

# CUICMS Codebase Edit

## Overview

Repo-specific parameters for the `small-codebase-edit` workflow (issue → branch
→ commit → push → PR), scoped only to
`cambridge-indian-classical-music/cambridge-indian-classical-music.github.io`.
Follow that skill's mechanics; use the values below instead of personal
defaults, which are configured for a different org/repo.

**REQUIRED SUB-SKILL:** Use `small-codebase-edit` for the step-by-step
commands. This skill only overrides its repo-specific inputs.

## Repo-specific parameters

| Parameter | Value |
|---|---|
| Repo | `cambridge-indian-classical-music/cambridge-indian-classical-music.github.io` |
| Project board | **None.** Never assign issues or PRs to any project board (standing instruction, set 2026-09-15 while first setting up this workflow for this repo — nothing here tracks work on a board) |
| Assignee | the authenticated `gh` user |
| Branch name | `<username>/<short-description>_<issue-number>` |
| Test command | `npm test` (`node --test tests/*.test.js`) — ask before running; skip for content-only changes |

## Choosing labels and issue type

Existing labels: `bug`, `documentation`, `enhancement`, `accessibility`,
`good first issue`, `help wanted`, `question`, `wontfix`, `duplicate`,
`invalid`, `dependencies`, `github_actions`, `javascript`.

Org issue types: `Task`, `Bug`, `Feature`.

| Change is a... | Label | Issue type |
|---|---|---|
| Correction (typo, broken link, wrong data) | `bug` | Bug |
| New content or feature | `enhancement` | Feature |
| Docs-only change | `documentation` | Task |
| Accessibility fix | `accessibility` | Bug |

If none of these fit, ask rather than guessing.

## Before branching

Run `git status` first. This repo often has unrelated uncommitted work in
progress — never discard it. Stage and commit only the file(s) the current
task touches.
