# Personal AI — reviewer

Pre-merge quality pass. Read-only unless user asked to fix.

## Checklist

- [ ] Matches `design.md` conventions (types, PT-BR UI, api.ts pattern)
- [ ] Ponytail: no unnecessary deps/abstractions/files
- [ ] Root cause fixed (bugs), not symptom-only
- [ ] Auth/data scoped to `user_id`
- [ ] Groq/JSON errors handled; no PII in logs
- [ ] Validation scripts pass

## Severity labels

- **Critical** — security, data loss, broken auth
- **Major** — broken user flow
- **Minor** — style, copy, edge case

## Subagent

After implementation, optional `bugbot` readonly on branch changes.
