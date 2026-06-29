# Personal AI – Treinador inteligente

App web de treino personalizado com IA gratuita ([Groq](https://console.groq.com)), backend **FastAPI** async, frontend **Next.js** em português, e biblioteca de exercícios via [wger.de](https://wger.de) (API pública, sem chave).

## Stack

| Camada | Tecnologia |
|--------|------------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind |
| Backend | FastAPI, SQLAlchemy async, PostgreSQL |
| IA | Groq (`llama-3.3-70b-versatile`) — tier gratuito |
| Exercícios | wger API (`language=7` português) |

## Pré-requisitos

- **Dev rápido:** SQLite embutido (padrão, sem Docker)
- **Produção:** Docker + Postgres (`docker compose up`)
- Node.js 20+
- Python 3.12+
- Chave Groq gratuita em [console.groq.com](https://console.groq.com) (opcional — sem chave usa plano base local)

## Subir com Docker

```bash
cp .env.example .env
# Edite GROQ_API_KEY no .env

docker compose up -d postgres
# API local (recomendado em dev):
cd apps/api
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
set DATABASE_URL=postgresql+asyncpg://personal_ai:personal_ai@localhost:5432/personal_ai
uvicorn app.main:app --reload --port 8000
```

## Frontend

```bash
cd apps/web
npm install
cp ../../.env.example .env.local
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Fluxo

1. **Registrar** → onboarding em 8 etapas (PT-BR)
2. **Gerar plano** — Groq + regras em `docs/TRAINING_GENERATION_RULES.md`
3. **Dashboard** — treino do dia, semana, insights
4. Exercícios enriquecidos com imagens/vídeos do wger quando disponíveis

## Documentação

- [`design.md`](design.md) — referência compacta para agentes (leia primeiro)
- [`AGENTS.md`](AGENTS.md) — orquestração de agentes + Ponytail
- [`.cursor/orchestration/README.md`](.cursor/orchestration/README.md) — time autônomo (bugs + features)
- [`docs/PRD.md`](docs/PRD.md)
- [`docs/TRAINING_GENERATION_RULES.md`](docs/TRAINING_GENERATION_RULES.md)
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)

## Deploy rápido (grátis)

### Opção 1: Render (API + Web)

1. Suba o repositório no GitHub.
2. No Render, use **Blueprint** apontando para `render.yaml` da raiz.
3. Configure variáveis obrigatórias no serviço `personal-ai-api`:
   - `DATABASE_URL` (Postgres gerenciado, ex. Neon/Supabase)
   - `JWT_SECRET`
   - `GROQ_API_KEY`
   - `CORS_ORIGINS` (URL pública do frontend)
4. Configure no serviço `personal-ai-web`:
   - `NEXT_PUBLIC_API_URL` (URL pública da API)
5. Valide:
   - API: `GET /health` retorna `{"status":"ok"}`
   - Web: registro/login, onboarding e geração de treino.

### Opção 2: Vercel (Web) + Render/Railway (API)

1. Deploy da API em Render/Railway com variáveis acima.
2. Deploy da Web na Vercel com root em `apps/web`.
3. Defina `NEXT_PUBLIC_API_URL` na Vercel com URL pública da API.
4. Ajuste `CORS_ORIGINS` na API para o domínio final da Vercel.

## Próximas fases

- Log de treino + feedback → adaptação automática
- Chat coach
- Progresso com gráficos
- Gamificação
