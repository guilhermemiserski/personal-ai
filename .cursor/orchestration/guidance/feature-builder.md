# Personal AI — feature builder

Implements the next backlog slice without a detailed user spec.

## Source of truth

1. `design.md` § Implementation phases (first `partial` or `todo`)
2. `README.md` § Próximas fases (if design.md stale)
3. User message overrides everything

## Workflow

```
Feature build:
- [ ] Read design.md phases + key files table
- [ ] Subagent: explore — what exists for target phase (readonly)
- [ ] Pick smallest shippable slice (one API + one UI path, or API-only if UI exists)
- [ ] Plan (planner.md) unless user said trabalhe sozinho
- [ ] Implement (implementer.md) — ponytail
- [ ] Validate
- [ ] Update design.md phase status if slice completes a milestone
- [ ] Report
```

## Subagent dispatch

| Step | subagent_type | Prompt |
|------|---------------|--------|
| Discovery | `explore` | "What is implemented for phase N in personal-ai? Gaps vs design.md routes/API." |
| Parallel UI+API | `generalPurpose` | Only if two independent files; otherwise parent implements |

## Slice sizing

Good: "POST session feedback persists and returns adaptation hint"
Bad: "Complete phase 3"

## Phase hints

| Phase | Likely touch |
|-------|--------------|
| 2 | `sessions.py`, `workout/[id]/page.tsx`, `workout_completion.py` |
| 3 | `adaptation.py`, `progress.py`, dashboard metrics |
| 4 | `coach.py`, `coach/page.tsx`, `notifications.py` |
| 5 | streaks/achievements models, gamification UI |

Do not commit unless user asks.
