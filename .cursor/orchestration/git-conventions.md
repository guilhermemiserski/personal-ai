# Git conventions — Personal AI

## Base branch

`main` (default integration branch).

## Branch naming

| Work type | Pattern | Example |
|-----------|---------|---------|
| GitHub issue | `issue/<number>` | `issue/42` |
| Feature (autonomous) | `feat/<short-slug>` | `feat/session-feedback` |
| Bug fix | `fix/<short-slug>` | `fix/onboarding-state` |

Do not use descriptive suffixes on issue branches (`issue/42-fix-login`).

## Before implementing

```powershell
git fetch origin
git checkout main
git pull origin main
git checkout issue/<n> 2>$null; if (-not $?) { git checkout -b issue/<n> }
```

For autonomous feature/bug work without an issue number:

```powershell
git checkout -b feat/<slug>   # or fix/<slug>
```

Stay on the current branch if work is already in progress on the correct name.

## Commits and PRs

- Conventional commits when the user asks to commit.
- Reference issue number in PR body when applicable.
- Do not commit unless the user explicitly requests it.
