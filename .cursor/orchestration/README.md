# Personal AI orchestration

Agent team config for autonomous bug hunting and feature work. Committed in-repo so the whole team shares it.

## Quick start

Tell Cursor:

- *"Use personal-ai-orchestrator — trabalhe sozinho"*
- *"personal-ai-bug-hunt"*
- *"personal-ai-feature — próxima fase"*
- *"personal-ai-validate"*

## Layout

```
.cursor/orchestration/
  config.yml           # validation contract
  git-conventions.md
  guidance/            # role playbooks (planner, bug-hunter, …)
  scripts/             # preflight, build, lint, test (PowerShell)
.cursor/skills/        # orchestrator + specialists
design.md              # read first (saves tokens)
```

## Validation

```powershell
.cursor/orchestration/scripts/preflight.ps1
.cursor/orchestration/scripts/build.ps1
.cursor/orchestration/scripts/lint.ps1
.cursor/orchestration/scripts/test.ps1   # optional; needs running stack for e2e
```

## Ponytail

Always-on rule: `.cursor/rules/ponytail.mdc` (from [ponytail](https://github.com/DietrichGebert/ponytail)).
