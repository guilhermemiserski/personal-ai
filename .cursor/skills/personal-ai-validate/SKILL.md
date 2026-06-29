---
name: personal-ai-validate
description: >-
  Runs personal-ai validation scripts (preflight, build, lint, optional e2e)
  per .cursor/orchestration/config.yml. Use for validate only, validar,
  run CI locally, or check if changes build.
---

# Personal AI Validate

Runs the validation contract in [`.cursor/orchestration/config.yml`](../../orchestration/config.yml).

## Script order

From repo root (PowerShell):

```powershell
.cursor/orchestration/scripts/preflight.ps1
.cursor/orchestration/scripts/build.ps1
.cursor/orchestration/scripts/lint.ps1
.cursor/orchestration/scripts/test.ps1   # optional; skips if API down
```

API import check (from `apps/api`, venv active):

```powershell
python -c "import app.main"
```

## On failure

Read [`.cursor/orchestration/guidance/build-test-fix.md`](../../orchestration/guidance/build-test-fix.md). Fix and re-run failed step only.

## Report

```markdown
## Validation

| Step | Result |
|------|--------|
| preflight | pass/fail |
| web build | pass/fail |
| api import | pass/fail |
| lint | pass/fail |
| e2e | pass/fail/skipped |

### Errors
<first failure snippet>
```

## Invocation

- `personal-ai-validate`
- `validar o projeto`
- `validate only`
