---
name: personal-ai-orchestrator
description: >-
  Coordinates autonomous agent team for personal-ai: bug hunting, feature
  building, validation. Reads design.md and dispatches specialist subagents.
  Use when the user wants agents to work alone, says trabalhe sozinho, time de
  agentes, melhore o projeto, or gives a vague goal without a detailed spec.
---

# Personal AI Orchestrator

Runs a **specialist team** without requiring detailed user specs. Token budget: read [`design.md`](../../../design.md) only — not full docs.

## Team roles

| Role | Guidance | Skill / subagent |
|------|----------|------------------|
| Planner | `.cursor/orchestration/guidance/planner.md` | parent agent |
| Bug hunter | `guidance/bug-hunter.md` | `personal-ai-bug-hunt` or Task `explore` |
| Feature builder | `guidance/feature-builder.md` | `personal-ai-feature` |
| Implementer | `guidance/implementer.md` | parent or Task `generalPurpose` |
| Reviewer | `guidance/reviewer.md` | Task `bugbot` readonly |
| Validator | `config.yml` scripts | `personal-ai-validate` |

Also read `guidance/common.md` once per session.

## Execution spine

Copy and track:

```
Orchestrator:
- [ ] 1. Read design.md
- [ ] 2. Classify intent (bug | feature | both | validate)
- [ ] 3. Dispatch specialists (parallel when independent)
- [ ] 4. Merge findings / pick highest-value work
- [ ] 5. Plan (unless trabalhe sozinho / implement immediately)
- [ ] 6. Implement with ponytail (.cursor/rules/ponytail.mdc)
- [ ] 7. Validate (preflight → build → lint → e2e if stack up)
- [ ] 8. Review (bugbot on diff, optional)
- [ ] 9. Report
```

## Intent routing

| User says | Route |
|-----------|-------|
| *trabalhe sozinho*, *autônomo*, no detail | bug-hunt top issues → fix 1 → then next backlog feature slice |
| *bugs*, *caçar bugs*, *bug hunt* | `personal-ai-bug-hunt` only |
| *feature*, *próxima fase*, *implementar* | `personal-ai-feature` only |
| *validar*, *validate* | `personal-ai-validate` only |
| GitHub issue URL/#n | Plan like issue workflow; branch `issue/<n>` |

Default autonomous mode: **skip plan approval** when user used trabalhe sozinho / autônomo.

## Subagent dispatch (Task tool)

Launch in parallel when tasks are independent:

```text
explore (readonly, very thorough):
  "Personal AI repo at <workspace>. Read design.md. List bugs OR phase gaps per user intent."

bugbot (readonly, after changes):
  "Full Repository Path: <workspace>\nDiff: uncommitted changes\nChange Description: <bullets>"

shell:
  Run .cursor/orchestration/scripts/*.ps1
```

Do not launch more than 2 explore agents on the same question.

## Report template

```markdown
## Orchestrator run

### Intent
bug | feature | mixed

### Done
- bullets

### Validation
- preflight / build / lint / e2e — pass|fail|skipped

### Next (autonomous)
- suggested next bug or backlog slice
```

## Related

- [bug-hunt skill](../personal-ai-bug-hunt/SKILL.md)
- [feature skill](../personal-ai-feature/SKILL.md)
- [validate skill](../personal-ai-validate/SKILL.md)
