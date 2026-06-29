---
name: personal-ai-feature
description: >-
  Implements the next personal-ai backlog slice without a detailed spec by
  reading design.md phases and shipping a minimal vertical slice. Use for
  próxima feature, próxima fase, implement backlog, or autonomous feature work.
---

# Personal AI Feature Builder

Specialist for **next backlog item**. Read [`design.md`](../../../design.md) § Implementation phases.

Full playbook: [`.cursor/orchestration/guidance/feature-builder.md`](../../orchestration/guidance/feature-builder.md).

## Quick start

1. Read `design.md` phases — pick first `partial` or `todo`
2. **Task `explore`** (readonly): what already exists for that phase
3. Define **one vertical slice** (planner.md unless user said trabalhe sozinho)
4. Implement per `guidance/implementer.md` + ponytail
5. Validate: preflight → build → lint
6. If slice completes a milestone, update phase row in `design.md`
7. Report

## Subagent prompt (explore)

```text
Personal AI — phase <N> from design.md.
Map implemented routes/API/UI vs missing. List smallest shippable slice (one user outcome).
Read only; cite file paths.
```

## Slice examples

| Phase | Good slice |
|-------|------------|
| 2 | Complete session + persist sets from workout page |
| 3 | Show weekly volume on dashboard from existing progress API |
| 4 | Wire coach send message UI to POST endpoint |

## Rules

- One slice per run
- Reuse `api.ts`, existing components
- No new npm/pip deps unless ladder rung 5 fails
- Do not commit unless user asks

## Invocation

- `personal-ai-feature`
- `próxima fase do backlog`
- `implemente a próxima feature`
