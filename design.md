# Personal AI — design reference (token-efficient)

Read this file first. Do not load `docs/PRD.md` or `docs/ARCHITECTURE.md` unless a task needs product nuance or deep architecture.

## Product

AI personal trainer (PT-BR UI). User onboards → Groq generates workout plan → dashboard/workouts/progress/coach.

## Stack

| Layer | Path | Tech |
|-------|------|------|
| Web | `apps/web/` | Next.js 15 App Router, React 19, TS, Tailwind, framer-motion |
| API | `apps/api/` | FastAPI async, SQLAlchemy 2 async, Pydantic v2 |
| DB | dev: SQLite / prod: Postgres | `DATABASE_URL` |
| AI | `apps/api/app/services/groq_ai.py` | Groq `llama-3.3-70b-versatile` (optional key) |
| Exercises | `wger.py`, `exercise_media.py` | wger.de API, `language=7` |

## Repo layout

```
apps/web/src/app/          # routes (page.tsx)
apps/web/src/components/   # UI
apps/web/src/lib/          # api.ts, auth.ts, types.ts
apps/api/app/routers/      # HTTP endpoints
apps/api/app/services/     # business + AI
apps/api/app/models/       # SQLAlchemy
apps/api/app/schemas/      # Pydantic
docs/TRAINING_GENERATION_RULES.md  # AI plan rules (read only for plan-gen work)
```

## Routes (web)

| Route | Purpose |
|-------|---------|
| `/login`, `/register`, `/forgot-password` | Auth |
| `/onboarding` | 8-step wizard |
| `/dashboard` | Home / today's workout |
| `/workout/[id]` | Active workout |
| `/progress` | Charts |
| `/profile` | Settings |
| `/coach` | AI chat |
| `/notifications` | In-app notifications |

## API surface (implemented)

| Prefix | Router file |
|--------|-------------|
| `/auth/*` | `routers/auth.py` |
| `/me/profile`, onboarding | `routers/profile.py` |
| `/me/plan/*` | `routers/plans.py` |
| `/me/workouts/*`, `/me/sessions/*` | `routers/sessions.py` |
| `/me/progress`, metrics | `routers/progress.py` |
| `/me/coach/*` | `routers/coach.py` |
| `/me/notifications` | `routers/notifications.py` |
| `/exercises/*` | `routers/exercises.py` |

Auth: JWT email/password. All `/me/*` scoped by `user_id`. Passwords bcrypt.

## Conventions

- **Language:** UI copy PT-BR; code identifiers English.
- **Types:** Always typed — no `any` / `var` in TS; explicit types in Python.
- **API client:** `apps/web/src/lib/api.ts` — extend here, don't scatter fetch.
- **Ponytail:** `.cursor/rules/ponytail.mdc` always on — smallest correct diff, reuse existing helpers.
- **Commits:** conventional commits; only when user asks.
- **Branch:** `main` base; feature branches `feat/<slug>` or `fix/<slug>`; issues `issue/<n>`.

## Env

```env
# API
DATABASE_URL=
JWT_SECRET=
GROQ_API_KEY=
CORS_ORIGINS=http://localhost:3000
# Web
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Dev commands

```powershell
.\start-dev.ps1                          # API + web (separate windows)
cd apps/api; uvicorn app.main:app --reload --port 8000
cd apps/web; npm run dev
```

Validation: `.cursor/orchestration/scripts/*.ps1` (orchestrator skill).

## Implementation phases (backlog — pick highest incomplete)

| Phase | Status | Scope |
|-------|--------|-------|
| 0 | done | Auth, DB, docker-compose, docs |
| 1 | done | Onboarding + plan generation |
| 2 | partial | Workout execution, logging (load_kg), feedback, session resume |
| 3 | partial | Adaptation engine + dashboard/progress adaptation metrics |
| 4 | partial | Coach chat, notifications |
| 5 | todo | Gamification, PWA polish |

**Autonomous feature work:** read phase table → choose first `partial`/`todo` item with clear user value → implement minimal slice → validate.

## Bug-hunt hotspots

- `groq_ai.py` / `plan_validator.py` — JSON schema, fallback without API key
- `onboarding/page.tsx` — large wizard, state persistence
- `api.ts` — token refresh, error handling
- `sessions.py` / `workout_completion.py` — session lifecycle
- `adaptation.py` — plan patches after feedback
- E2E: `apps/web/tests/e2e/app.e2e.spec.ts`

## Key files (touch map)

| Task | Start here |
|------|------------|
| New page | `apps/web/src/app/<route>/page.tsx` + `AppShell` / `BottomNav` |
| New endpoint | `routers/*.py` → `services/*.py` → `schemas/*.py` |
| Plan AI | `groq_ai.py`, `plan_validator.py`, `TRAINING_GENERATION_RULES.md` |
| DB model | `models/*.py` + startup migration in `main.py` if SQLite |

## Orchestration

Skills in `.cursor/skills/`. Guidance in `.cursor/orchestration/guidance/`. Agents read `design.md` + one guidance file for their role.
