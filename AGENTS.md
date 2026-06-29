# Personal AI — agent instructions

## First read

1. [`design.md`](design.md) — stack, routes, conventions, backlog (token-efficient; prefer over full docs).
2. [`.cursor/rules/ponytail.mdc`](.cursor/rules/ponytail.mdc) — always apply; lazy senior dev ladder.

## Autonomous team

Use project skills (`.cursor/skills/`):

| Skill | When |
|-------|------|
| `personal-ai-orchestrator` | User wants autonomous work, "time de agentes", or vague "melhore o projeto" |
| `personal-ai-bug-hunt` | Find/fix bugs without detailed repro |
| `personal-ai-feature` | Implement next backlog item without a spec |
| `personal-ai-validate` | Run validation only |
| `personal-ai-security-review` | Security audit (auth, IDOR, secrets) |


Orchestration config: `.cursor/orchestration/`.

## Invariants

- UI PT-BR; typed code; no new deps unless ladder rung 5 fails.
- Smallest diff that fixes root cause (ponytail bug rule).
- Do not commit/push/PR unless user asks.
- Full product detail: `docs/PRD.md`. Deep architecture: `docs/ARCHITECTURE.md`.
