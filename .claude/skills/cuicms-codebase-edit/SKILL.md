---
name: cuicms-codebase-edit
description: Use when making any change — code, content, or config — to the cambridge-indian-classical-music.github.io repo (CUICMS website), however small.
---

# CUICMS Codebase Edit

## Overview

Self-contained issue → branch → commit → push → PR workflow for this repo.
Follow it as written — the values below are fixed facts about this repo, not
personal defaults to confirm with anyone.

## Fixed parameters

| Parameter     | Value                                                                                                                                   |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Repo          | `cambridge-indian-classical-music/cambridge-indian-classical-music.github.io`                                                           |
| Project board | **None.** Never assign issues or PRs to any project board                                                                               |
| Assignee      | the authenticated `gh` user (`gh api user --jq .login`)                                                                                 |
| Branch name   | `<username>/<short-description>_<issue-number>`                                                                                         |
| Test command  | `npm test` (`node --test tests/*.test.js`); `npm run verify` runs format-check + typecheck + build + test together, and is what CI runs |

## Choosing labels and issue type

Existing labels: `bug`, `documentation`, `enhancement`, `accessibility`,
`good first issue`, `help wanted`, `question`, `wontfix`, `duplicate`,
`invalid`, `dependencies`, `github_actions`, `javascript`.

Org issue types: `Task`, `Bug`, `Feature`.

| Change is a...                                      | Label           | Issue type |
| --------------------------------------------------- | --------------- | ---------- |
| Correction (typo, broken link, wrong data)          | `bug`           | Bug        |
| New content or feature                              | `enhancement`   | Feature    |
| Docs-only change (including files under `.claude/`) | `documentation` | Task       |
| Accessibility fix                                   | `accessibility` | Bug        |

If none of these fit, ask rather than guessing.

## Step 1 — Create a GitHub issue

```
GH_PAGER="" gh issue create \
  --repo cambridge-indian-classical-music/cambridge-indian-classical-music.github.io \
  --title "<title>" \
  --body "<body>" \
  --assignee <username> \
  --label "<label>"
```

Note the issue number from the output, then set its issue type:

```
GH_PAGER="" gh issue view <number> --repo cambridge-indian-classical-music/cambridge-indian-classical-music.github.io --json id --jq '.id'
GH_PAGER="" gh api orgs/cambridge-indian-classical-music/issue-types
```

Match the chosen type's `node_id` from that list, then:

```
GH_PAGER="" gh api graphql -f query='
mutation {
  updateIssueIssueType(input: {issueId: "<issue_node_id>", issueTypeId: "<type_node_id>"}) {
    clientMutationId
  }
}'
```

**Do not run `gh project item-add`** — no project board tracks this repo's
issues.

## Step 2 — Branch and make the change

```
git checkout main
git pull origin main
git checkout -b <username>/<short-description>_<issue-number>
```

Run `git status` before branching — this repo often has unrelated
uncommitted work in progress. Never discard it; only stage and commit the
file(s) this task touches.

Make the change.

## Step 3 — Format, commit, push

Run `npm run format` (Prettier) before committing. CI's `format:check` job
fails the build on unformatted files, including Markdown — this has already
tripped up a PR that added an unformatted `.claude/skills/**/SKILL.md` file.

```
git add <files>
git commit -m "<short description>

Closes #<issue_number>"
git push -u origin <branch_name>
```

## Step 4 — Create a pull request

```
GH_PAGER="" gh pr create \
  --repo cambridge-indian-classical-music/cambridge-indian-classical-music.github.io \
  --title "<title>" \
  --body $'## Summary\n\n<description>\n\nCloses #<issue_number>' \
  --assignee <username> \
  --label "<label>" \
  --base main \
  --head <branch_name>
```

Do not add the PR to any project board either.

## Step 5 — Tests and CI

Ask before running `npm test` / `npm run verify` locally — skip for
content-only changes. Either way, check CI after pushing:

```
GH_PAGER="" gh pr checks <pr_number>
```

CI runs `npm run verify`, so a formatting or type issue fails the build even
when the underlying change is correct.

## Step 6 — Report back

Summarize: issue URL/number, branch name, PR URL/number, and test/CI
results.
