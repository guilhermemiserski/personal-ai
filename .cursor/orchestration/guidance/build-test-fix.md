# Personal AI — build/test fix loop

When validation fails:

1. Read the failing script output (last 50 lines).
2. Fix the **first** error only; re-run that script.
3. Do not disable lint rules or skip tests to greenwash.
4. If e2e fails for env (API down), note in report and pass build+lint.

## Common fixes

| Error | Likely fix |
|-------|------------|
| TS type in page.tsx | align with `lib/types.ts` or API schema |
| ESLint import | fix path or remove unused |
| Python import | missing dep in venv or circular import in routers |
| Next build | missing `loading.tsx` or client/server boundary |

Max 3 fix iterations before reporting blocker to user.
