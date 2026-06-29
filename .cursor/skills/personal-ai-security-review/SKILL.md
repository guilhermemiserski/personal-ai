---
name: personal-ai-security-review
description: >-
  Runs security-review subagent on personal-ai branch or uncommitted changes.
  Checks auth, IDOR, JWT, input validation, secrets, and CORS. Use for
  security review, revisão de segurança, audit, or before deploy.
---

# Personal AI — Security Review

Specialist dispatch for security findings before merge/deploy.

## When to use

- User asks: *security review*, *revisão de segurança*, *audit*, *vulnerabilidades*
- Orchestrator after large API/auth changes
- Before `git push` to production

## Hotspots (read first)

| Area | Files |
|------|-------|
| Auth / JWT | `apps/api/app/core/security.py`, `routers/auth.py`, `core/deps.py` |
| IDOR `/me/*` | All `routers/*.py` — must scope by `current_user.id` |
| Sessions | `routers/sessions.py` — workout/session ownership |
| Client tokens | `apps/web/src/lib/auth.ts`, `api.ts` |
| Secrets | `.env.example` only in repo; never commit `.env` |
| AI / PII | `services/groq_ai.py` — no PII in logs |

## Subagent dispatch (Task tool)

```text
subagent_type: security-review
readonly: true
run_in_background: false

Full Repository Path: <workspace absolute path>
Diff: branch changes
Custom Instructions: FastAPI + Next.js PT-BR fitness app. Focus auth/JWT,
IDOR on /me/*, session ownership, SQL/ORM injection, CORS, input validation,
Groq key handling, XSS in user notes/coach messages.
```

Use `uncommitted changes` only when user wants dirty-tree review.

## Manual fallback

If the security-review subagent is unavailable, grep and read:

```
grep -r "get_current_user" apps/api/app/routers/
grep -r "HTTPException" apps/api/app/routers/sessions.py
```

Checklist:

- [ ] All `/me/*` queries filter `user_id == current_user.id`
- [ ] UUID path params validated; 404 not 403 for other users' resources
- [ ] Passwords bcrypt; JWT secret from env
- [ ] No `eval`, `exec`, raw SQL with user input
- [ ] CORS not `*` in production config
- [ ] Coach/onboarding notes escaped in UI (React default)

## Report format

| Severity | Location | Finding |
|----------|----------|---------|
| Critical/Major/Minor | file:line | description |

Do not auto-fix unless user asks.

## Orchestrator integration

`personal-ai-orchestrator` may launch this after implementation when auth, sessions, or payments touched.
