# Personal AI — common invariants

Config: `.cursor/orchestration/config.yml`.

- **Context:** Read `design.md` first; avoid loading full PRD/ARCHITECTURE unless needed.
- **Ponytail:** `.cursor/rules/ponytail.mdc` — reuse `api.ts`, existing routers/services, native inputs.
- **Web:** `apps/web/src/lib/api.ts` for HTTP; `AppShell` + `BottomNav` for layout; PT-BR copy.
- **API:** Routers thin → services fat; Pydantic schemas in `schemas/`; models in `models/`.
- **Types:** No `any`/`var` in TS; explicit Python types.
- **AI plans:** `groq_ai.py` + `plan_validator.py` + `docs/TRAINING_GENERATION_RULES.md`.
- **DB:** `create_all` on startup; ad-hoc column migrations in `main.py` for SQLite/Postgres.
- **Commits:** Only when user asks. **Branches:** see `git-conventions.md`.
