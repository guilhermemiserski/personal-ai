from typing import Any

from app.services.plan_utils import normalize_alternatives


class PlanValidationError(Exception):
    def __init__(self, message: str) -> None:
        self.message = message
        super().__init__(message)


def _safe_int_sets(value: object) -> int:
    try:
        return int(value)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        raise PlanValidationError(f"Séries inválidas: {value!r}") from None


def validate_plan(plan: dict[str, Any], days_per_week: int, session_minutes: int) -> None:
    weeks = plan.get("weeks")
    if not weeks or not isinstance(weeks, list):
        raise PlanValidationError("Plano deve conter 'weeks'.")

    week1 = weeks[0]
    days = week1.get("days") or []
    if len(days) < days_per_week:
        raise PlanValidationError(
            f"Esperado pelo menos {days_per_week} dias de treino, recebido {len(days)}."
        )

    max_sets_by_duration = {30: 14, 45: 20, 60: 26, 90: 34}
    cap = max_sets_by_duration.get(session_minutes, 26)
    min_exercises = 3 if session_minutes <= 35 else 4

    for day in days:
        exercises = day.get("exercises") or []
        if not exercises:
            raise PlanValidationError(f"Dia '{day.get('day_label')}' sem exercícios.")
        if len(exercises) < min_exercises:
            raise PlanValidationError(
                f"Dia '{day.get('day_label')}' com poucos exercícios ({len(exercises)}). "
                f"Mínimo esperado: {min_exercises}."
            )

        total_sets = sum(_safe_int_sets(ex.get("sets", 0)) for ex in exercises)
        if total_sets > cap + 4:
            raise PlanValidationError(
                f"Dia '{day.get('day_label')}' excede volume para {session_minutes} min ({total_sets} séries)."
            )

        for ex in exercises:
            if not ex.get("name"):
                raise PlanValidationError("Exercício sem nome.")
            alts = normalize_alternatives(ex.get("alternatives")) or []
            if len(alts) < 1:
                raise PlanValidationError(f"Exercício '{ex.get('name')}' precisa de alternativas.")
