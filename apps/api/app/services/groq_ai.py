import json
import re
from pathlib import Path
from typing import Any

from openai import AsyncOpenAI

from app.config import settings
from app.models.training import WorkoutSession
from app.models.user import UserProfile
from app.services.plan_validator import PlanValidationError, validate_plan

def _load_rules() -> str:
    candidates = [
        Path(__file__).resolve().parent / "data" / "training_rules.md",
        Path(__file__).resolve().parents[4] / "docs" / "TRAINING_GENERATION_RULES.md",
        Path("/docs/TRAINING_GENERATION_RULES.md"),
    ]
    for path in candidates:
        if path.exists():
            # Keep prompt lean to reduce latency/cost while preserving core constraints.
            return path.read_text(encoding="utf-8")[:7000]
    return "Use progressive overload and personalize by user profile."


def _profile_context(profile: UserProfile) -> str:
    return json.dumps(
        {
            "age": profile.age,
            "biological_sex": profile.biological_sex,
            "height_cm": profile.height_cm,
            "weight_kg": profile.weight_kg,
            "training_experience": profile.training_experience,
            "primary_goal": profile.primary_goal,
            "days_per_week": profile.days_per_week,
            "session_duration_minutes": profile.session_duration_minutes,
            "gym_access": profile.gym_access,
            "injuries": profile.injuries,
            "injury_notes": profile.injury_notes,
            "preferred_style": profile.preferred_style,
            "can_pushups": profile.can_pushups,
            "can_squat": profile.can_squat,
            "cardio_level": profile.cardio_level,
            "strength_level": profile.strength_level,
        },
        ensure_ascii=False,
    )


def _parse_json_content(content: str) -> dict[str, Any]:
    cleaned = content.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    return json.loads(cleaned)


class GroqPlanService:
    def __init__(self) -> None:
        self.client = AsyncOpenAI(
            api_key=settings.groq_api_key,
            base_url=settings.groq_base_url,
        )
        self.model = settings.groq_model

    async def generate_plan(self, profile: UserProfile) -> dict[str, Any]:
        if not settings.groq_api_key:
            return _fallback_plan(profile)

        system = (
            "Você é um personal trainer especialista. Gere planos de treino em JSON válido, "
            "seguindo as regras fornecidas. Responda APENAS com JSON, sem markdown. "
            "Use nomes de exercícios em português quando possível. "
            "Inclua rationale em português."
        )
        user_prompt = (
            f"REGRAS:\n{_load_rules()}\n\n"
            f"PERFIL DO USUÁRIO:\n{_profile_context(profile)}\n\n"
            "CONSTRAINTS OBRIGATÓRIAS:\n"
            "- Respeite totalmente session_duration_minutes e days_per_week.\n"
            "- Para cada dia, gere no mínimo 4 exercícios (3 se duration <= 35).\n"
            "- Cada exercício precisa de alternatives com pelo menos 1 item.\n\n"
            "Gere a semana 1 do plano no schema: "
            '{"program_name","weekly_split","rationale","weeks":[{"week_number":1,"days":'
            '[{"day_label","estimated_minutes","exercises":[{"name","muscle_group","sets",'
            '"reps","rest_seconds","tempo","target_rpe","instructions","alternatives":[]}]}]}]}'
        )

        last_error: str | None = None
        candidate_models: list[str] = [self.model]
        if settings.groq_fallback_model and settings.groq_fallback_model != self.model:
            candidate_models.append(settings.groq_fallback_model)

        for model_name in candidate_models:
            messages = [
                {"role": "system", "content": system},
                {"role": "user", "content": user_prompt},
            ]
            if last_error:
                messages.append(
                    {
                        "role": "user",
                        "content": f"Corrija o plano. Erro de validação: {last_error}",
                    }
                )

            try:
                response = await self.client.chat.completions.create(
                    model=model_name,
                    messages=messages,
                    response_format={"type": "json_object"},
                    temperature=0.35,
                    timeout=settings.groq_request_timeout_seconds,
                )
            except Exception:
                # Try fallback model/local generation if provider is slow/unavailable.
                continue
            content = response.choices[0].message.content or "{}"
            try:
                plan = _parse_json_content(content)
            except Exception:
                continue
            try:
                validate_plan(
                    plan,
                    days_per_week=profile.days_per_week or 3,
                    session_minutes=profile.session_duration_minutes or 60,
                )
                return plan
            except PlanValidationError as exc:
                last_error = exc.message

        return _fallback_plan(profile)

    async def coach_reply(
        self,
        profile: UserProfile,
        user_message: str,
        recent_sessions: list[WorkoutSession],
    ) -> str:
        if not settings.groq_api_key:
            return (
                "Pelo seu histórico recente, priorize execução técnica, sono e progressão gradual. "
                "Se houver dor articular, reduza volume em 20% por 1 semana e ajuste exercícios."
            )

        session_context = [
            {
                "completed": s.completed,
                "effort": s.perceived_effort,
                "energy": s.energy_level,
                "soreness": s.soreness_level,
                "difficulty": s.difficulty_level,
                "notes": s.notes,
                "adaptation_summary": s.adaptation_summary,
            }
            for s in recent_sessions[:10]
        ]
        system = (
            "Você é um treinador pessoal experiente. Responda em português de forma objetiva, "
            "com recomendações práticas e seguras baseadas em evidências."
        )
        prompt = (
            f"Perfil: {_profile_context(profile)}\n"
            f"Sessoes recentes: {json.dumps(session_context, ensure_ascii=False)}\n"
            f"Pergunta do usuário: {user_message}\n"
            "Responda em até 6 linhas e inclua um próximo passo concreto."
        )
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "system", "content": system}, {"role": "user", "content": prompt}],
            temperature=0.5,
        )
        return (response.choices[0].message.content or "").strip() or "Mantenha consistência e ajuste carga progressivamente."


def _fallback_plan(profile: UserProfile) -> dict[str, Any]:
    days = profile.days_per_week or 3
    duration = profile.session_duration_minutes or 45
    day_templates: list[dict[str, Any]] = []
    labels = _split_labels(days)
    for i in range(days):
        day_templates.append(
            {
                "day_label": labels[i % len(labels)],
                "estimated_minutes": duration,
                "exercises": _day_exercises(labels[i % len(labels)], i),
            }
        )

    goal = profile.primary_goal or "saúde geral"
    return {
        "program_name": f"Plano personalizado – {goal}",
        "weekly_split": f"{days} dias/semana",
        "rationale": (
            "Plano base gerado localmente (configure GROQ_API_KEY para IA completa). "
            "Ajustado ao seu perfil e disponibilidade."
        ),
        "weeks": [{"week_number": 1, "days": day_templates}],
    }


def _split_labels(days: int) -> list[str]:
    if days <= 2:
        return ["Full Body A", "Full Body B"]
    if days == 3:
        return ["Full Body A", "Full Body B", "Full Body C"]
    if days == 4:
        return ["Superior A", "Inferior A", "Superior B", "Inferior B"]
    if days == 5:
        return ["Push", "Pull", "Pernas", "Superior", "Inferior"]
    return ["Push A", "Pull A", "Pernas A", "Push B", "Pull B", "Pernas B"]


def _day_exercises(label: str, index: int) -> list[dict[str, Any]]:
    full_body = [
        [
            _exercise("Agachamento livre", "pernas", "8-10", ["Leg press", "Agachamento goblet"]),
            _exercise("Supino reto", "peito", "8-12", ["Supino halteres", "Flexão"]),
            _exercise("Remada curvada", "costas", "8-12", ["Puxada frente", "Remada baixa"]),
            _exercise("Desenvolvimento com halteres", "ombros", "10-12", ["Elevação lateral", "Arnold press"]),
            _exercise("Prancha", "core", "30-45s", ["Dead bug", "Ab wheel"], sets=3),
        ],
        [
            _exercise("Levantamento terra romeno", "posterior", "8-10", ["Mesa flexora", "Stiff halteres"]),
            _exercise("Puxada alta", "costas", "8-12", ["Barra fixa assistida", "Remada unilateral"]),
            _exercise("Supino inclinado", "peito", "8-12", ["Crucifixo inclinado", "Máquina peitoral"]),
            _exercise("Afundo com halteres", "pernas", "10-12", ["Passada", "Bulgarian split squat"]),
            _exercise("Elevação de pernas", "core", "12-15", ["Prancha lateral", "Crunch"], sets=3),
        ],
        [
            _exercise("Hack squat", "pernas", "10-12", ["Agachamento frontal", "Leg press"]),
            _exercise("Remada baixa", "costas", "10-12", ["Remada cavalinho", "Remada sentada"]),
            _exercise("Paralelas assistidas", "tríceps/peito", "8-12", ["Supino fechado", "Tríceps testa"]),
            _exercise("Rosca direta", "bíceps", "10-12", ["Rosca alternada", "Rosca martelo"]),
            _exercise("Panturrilha em pé", "panturrilha", "12-15", ["Panturrilha sentada", "Donkey calf"]),
        ],
    ]

    split_map: dict[str, list[dict[str, Any]]] = {
        "Push": [
            _exercise("Supino reto", "peito", "6-10", ["Supino halteres", "Máquina peitoral"]),
            _exercise("Supino inclinado", "peito", "8-12", ["Crucifixo inclinado", "Flexão declinada"]),
            _exercise("Desenvolvimento militar", "ombros", "8-10", ["Arnold press", "Landmine press"]),
            _exercise("Elevação lateral", "ombros", "12-15", ["Elevação cabo", "Elevação inclinada"]),
            _exercise("Tríceps corda", "tríceps", "10-15", ["Tríceps francês", "Mergulho banco"]),
        ],
        "Pull": [
            _exercise("Puxada frente", "costas", "8-12", ["Barra fixa assistida", "Pulldown neutro"]),
            _exercise("Remada curvada", "costas", "8-12", ["Remada baixa", "Remada unilateral"]),
            _exercise("Face pull", "ombro posterior", "12-15", ["Crucifixo inverso", "Remada alta cabo"]),
            _exercise("Rosca direta", "bíceps", "10-12", ["Rosca alternada", "Rosca martelo"]),
            _exercise("Rosca martelo", "bíceps", "10-12", ["Rosca no banco inclinado", "Rosca cabo"]),
        ],
        "Pernas": [
            _exercise("Agachamento livre", "quadríceps", "6-10", ["Hack squat", "Leg press"]),
            _exercise("Levantamento terra romeno", "posterior", "8-10", ["Mesa flexora", "Stiff halteres"]),
            _exercise("Cadeira extensora", "quadríceps", "12-15", ["Sissy squat", "Step-up"]),
            _exercise("Mesa flexora", "posterior", "10-12", ["Nordic curl", "Flexora sentada"]),
            _exercise("Panturrilha em pé", "panturrilha", "12-20", ["Panturrilha sentada", "Leg press calf"]),
        ],
        "Superior A": [
            _exercise("Supino reto", "peito", "8-10", ["Supino halteres", "Máquina peitoral"]),
            _exercise("Remada curvada", "costas", "8-10", ["Puxada frente", "Remada baixa"]),
            _exercise("Desenvolvimento com halteres", "ombros", "10-12", ["Arnold press", "Elevação lateral"]),
            _exercise("Rosca direta", "bíceps", "10-12", ["Rosca martelo", "Rosca alternada"]),
            _exercise("Tríceps corda", "tríceps", "10-12", ["Tríceps testa", "Mergulho banco"]),
        ],
        "Inferior A": [
            _exercise("Agachamento livre", "quadríceps", "8-10", ["Leg press", "Hack squat"]),
            _exercise("Levantamento terra romeno", "posterior", "8-10", ["Stiff halteres", "Mesa flexora"]),
            _exercise("Afundo búlgaro", "pernas", "10-12", ["Passada", "Step-up"]),
            _exercise("Cadeira extensora", "quadríceps", "12-15", ["Sissy squat", "Agachamento goblet"]),
            _exercise("Panturrilha sentada", "panturrilha", "12-20", ["Panturrilha em pé", "Calf no leg press"]),
        ],
        "Superior B": [
            _exercise("Supino inclinado", "peito", "8-12", ["Crucifixo inclinado", "Flexão"]),
            _exercise("Puxada frente", "costas", "8-12", ["Barra fixa assistida", "Remada cavalinho"]),
            _exercise("Elevação lateral", "ombros", "12-15", ["Elevação cabo", "Arnold press"]),
            _exercise("Rosca alternada", "bíceps", "10-12", ["Rosca inclinada", "Rosca martelo"]),
            _exercise("Tríceps francês", "tríceps", "10-12", ["Tríceps corda", "Tríceps banco"]),
        ],
        "Inferior B": [
            _exercise("Leg press", "quadríceps", "10-12", ["Agachamento frontal", "Hack squat"]),
            _exercise("Stiff com halteres", "posterior", "10-12", ["Terra romeno", "Mesa flexora"]),
            _exercise("Mesa flexora", "posterior", "10-12", ["Nordic curl", "Flexora sentada"]),
            _exercise("Cadeira adutora", "adutores", "12-15", ["Afundo lateral", "Copenhagen plank"]),
            _exercise("Panturrilha em pé", "panturrilha", "12-20", ["Panturrilha sentada", "Leg press calf"]),
        ],
    }
    if label.startswith("Full Body"):
        return full_body[index % len(full_body)]
    return split_map.get(label, full_body[index % len(full_body)])


def _exercise(
    name: str,
    muscle_group: str,
    reps: str,
    alternatives: list[str],
    sets: int = 3,
) -> dict[str, Any]:
    return {
        "name": name,
        "muscle_group": muscle_group,
        "sets": sets,
        "reps": reps,
        "rest_seconds": 90,
        "tempo": "3-1-1",
        "target_rpe": 8,
        "instructions": f"Execute {name.lower()} com controle e boa técnica durante toda a série.",
        "alternatives": alternatives,
    }


groq_plan_service = GroqPlanService()
