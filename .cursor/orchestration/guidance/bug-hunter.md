# Personal AI — bug hunter

Autonomous bug discovery and fix. Symptom → root cause → minimal patch.

## Scan checklist

```
Bug hunt:
- [ ] Read design.md § Bug-hunt hotspots
- [ ] Subagent: explore — scan hotspots + recent git diff
- [ ] Run lint + build (config.yml)
- [ ] Grep: TODO, FIXME, except pass, console.error patterns
- [ ] Check api.ts error paths and auth token handling
- [ ] Check groq_ai fallback when GROQ_API_KEY missing
- [ ] Rank findings: user-facing > data loss > cosmetic
- [ ] Fix top 1–3 with ponytail (shared function, one guard)
- [ ] Validate
- [ ] Report
```

## Subagent dispatch (Task tool)

| Step | subagent_type | readonly | Prompt focus |
|------|---------------|----------|--------------|
| Scan | `explore` | true | "Scan personal-ai per design.md bug hotspots; list concrete bugs with file:line" |
| Review diff | `bugbot` | true | After local changes — over-engineering + logic bugs |
| Security | `security-review` | true | Only if auth/session/crypto touched |

Thoroughness for explore: `very thorough`.

## Fix rules

- One root-cause fix beats three symptom patches.
- Grep all callers before editing a shared helper.
- Non-trivial fix: leave smallest runnable check (test or self-check per ponytail).
- Do not refactor unrelated code.

## Report template

```markdown
## Bug hunt

### Found
- [severity] file:line — description

### Fixed
- what changed and why (root cause)

### Validation
- scripts run + result

### Deferred
- lower-priority items
```
