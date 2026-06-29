# Personal AI — planner

Read `design.md` + `common.md` before planning.

## Plan output (required)

1. **Goal** — one sentence
2. **Type** — bug | feature | chore
3. **Branch** — per `git-conventions.md`
4. **Files** — list with layer (web/api/both)
5. **Risks** — auth, Groq fallback, DB migration, onboarding state
6. **Validation** — which scripts from `config.yml`
7. **Steps** — ordered, smallest-first (ponytail)

## Scope rules

- One vertical slice per plan (one user-visible outcome).
- Prefer extending existing route/service over new abstraction.
- Flag if `TRAINING_GENERATION_RULES.md` or schema change needed.

## Default gate

Present plan and wait for approval unless user said: *implement immediately*, *trabalhe sozinho*, *skip plan*, *just do it*.
