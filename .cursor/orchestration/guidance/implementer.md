# Personal AI — implementer

Read `design.md` + `common.md`. Follow ponytail ladder.

## Order of work

1. Trace flow end-to-end (UI → `api.ts` → router → service → DB).
2. Change the shared/lowest layer that fixes root cause once.
3. Match surrounding naming, imports, error shape.
4. PT-BR strings for user-visible text.

## Layer hints

| Change | Pattern |
|--------|---------|
| New screen | `app/<route>/page.tsx`, reuse skeletons in `components/skeleton/` |
| API endpoint | router → service → schema; register router in `main.py` if new file |
| Client call | add typed function in `api.ts` |
| Plan AI | `groq_ai.py`; validate with `plan_validator.py` |

## After coding

Run validation per `config.yml` (at minimum preflight + build + lint).

Do not commit/push unless user asks.
