---
name: personal-ai-bug-hunt
description: >-
  Autonomously finds and fixes bugs in personal-ai by scanning hotspots,
  running validation, and applying ponytail root-cause fixes. Use for bug
  hunt, caçar bugs, fix issues, or when the user reports a problem without
  detailed reproduction steps.
---

# Personal AI Bug Hunt

Specialist subagent workflow. Read [`design.md`](../../../design.md) § Bug-hunt hotspots first.

Full playbook: [`.cursor/orchestration/guidance/bug-hunter.md`](../../orchestration/guidance/bug-hunter.md).

## Quick start

1. Read `design.md` + `guidance/bug-hunter.md`
2. **Task `explore`** (readonly, `very thorough`): scan hotspots + `git diff` + lint output
3. Rank bugs: user-facing > data loss > cosmetic
4. Fix top 1–3 (ponytail: root cause, grep callers)
5. Run `preflight.ps1` → `build.ps1` → `lint.ps1`
6. **Task `bugbot`** readonly on uncommitted changes
7. Report per bug-hunter template

## Subagent prompts (copy)

**Explore scan:**

```text
Repo: personal-ai (FastAPI + Next.js PT-BR fitness app).
Read design.md bug hotspots. Scan those files and apps/web/src/lib/api.ts.
Return numbered list: severity, file:line, symptom, likely root cause.
Do not fix — read only.
```

**Bugbot review (after fixes):**

```text
Full Repository Path: <workspace>
Diff: uncommitted changes
Change Description:
- <file>: <what changed>
Custom Instructions: ponytail minimal diff; flag symptom-only fixes.
```

## Rules

- Max 3 bugs per run unless user asked for full audit
- No drive-by refactors
- On validation fail: `guidance/build-test-fix.md`
- Do not commit unless user asks

## Invocation

- `personal-ai-bug-hunt`
- `caçar bugs no personal-ai`
- `encontre e corrija bugs`
