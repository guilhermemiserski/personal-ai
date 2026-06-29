from dataclasses import dataclass, field
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.training import PlannedExercise, PlannedWorkout, TrainingPlan, WorkoutSession


@dataclass
class AdaptationPatch:
    adaptation_type: str
    reason: str
    changes: list[dict[str, Any]] = field(default_factory=list)


def decide_adaptation(session: WorkoutSession) -> AdaptationPatch | None:
    effort = session.perceived_effort or 0
    energy = session.energy_level or 0
    soreness = session.soreness_level or 0
    difficulty = session.difficulty_level or 0

    if not session.completed:
        return AdaptationPatch(
            adaptation_type="volume_reduction",
            reason="Sessão não concluída — volume reduzido 20% no plano para retomar consistência.",
        )

    if effort <= 6 and difficulty <= 5:
        return AdaptationPatch(
            adaptation_type="volume_increase",
            reason="Treino fácil — +1 série no exercício principal do dia.",
        )

    if effort >= 9 or soreness >= 8:
        return AdaptationPatch(
            adaptation_type="volume_reduction",
            reason="Treino muito pesado — −1 série no último acessório do dia.",
        )

    if energy <= 4:
        return AdaptationPatch(
            adaptation_type="deload",
            reason="Baixa energia — descanso entre séries aumentado no dia.",
        )

    return None


def build_adaptation_summary(session: WorkoutSession, patch: AdaptationPatch | None = None) -> str:
    if patch is None:
        patch = decide_adaptation(session)

    if patch is None:
        return "Carga e volume adequados: mantenha progressão de reps antes de subir carga."

    if patch.changes:
        details = "; ".join(
            f"{change['field']} em {change['exercise_name']}" for change in patch.changes[:3]
        )
        return f"{patch.reason} Ajuste aplicado: {details}."

    return patch.reason


def _sorted_exercises(workout: PlannedWorkout) -> list[PlannedExercise]:
    return sorted(workout.exercises, key=lambda ex: ex.sort_order)


def _sync_exercise_to_plan_json(
    plan: TrainingPlan, workout: PlannedWorkout, exercise: PlannedExercise
) -> None:
    weeks = plan.plan_json.get("weeks") or []
    if not weeks:
        return
    days = weeks[0].get("days") or []
    if workout.day_index >= len(days):
        return
    json_exercises = days[workout.day_index].get("exercises") or []
    if exercise.sort_order >= len(json_exercises):
        return
    json_ex = json_exercises[exercise.sort_order]
    json_ex["sets"] = exercise.sets
    json_ex["rest_seconds"] = exercise.rest_seconds


def _record_change(
    patch: AdaptationPatch,
    exercise: PlannedExercise,
    field_name: str,
    old_value: int,
    new_value: int,
) -> None:
    if old_value == new_value:
        return
    patch.changes.append(
        {
            "planned_exercise_id": str(exercise.id),
            "exercise_name": exercise.name,
            "field": field_name,
            "from": old_value,
            "to": new_value,
        }
    )


async def apply_plan_adaptation(db: AsyncSession, session: WorkoutSession) -> AdaptationPatch | None:
    patch = decide_adaptation(session)
    if patch is None:
        return None

    workout_result = await db.execute(
        select(PlannedWorkout)
        .where(PlannedWorkout.id == session.planned_workout_id)
        .options(
            selectinload(PlannedWorkout.exercises),
            selectinload(PlannedWorkout.plan).selectinload(TrainingPlan.workouts).selectinload(
                PlannedWorkout.exercises
            ),
        )
    )
    workout = workout_result.scalar_one_or_none()
    if workout is None or workout.plan is None:
        return patch

    plan = workout.plan

    if patch.adaptation_type == "volume_reduction" and not session.completed:
        for planned_workout in plan.workouts:
            for exercise in _sorted_exercises(planned_workout):
                old_sets = exercise.sets
                exercise.sets = max(2, round(old_sets * 0.8))
                _record_change(patch, exercise, "séries", old_sets, exercise.sets)
                _sync_exercise_to_plan_json(plan, planned_workout, exercise)
        return patch

    exercises = _sorted_exercises(workout)
    if not exercises:
        return patch

    if patch.adaptation_type == "volume_increase":
        primary = exercises[0]
        old_sets = primary.sets
        primary.sets = min(old_sets + 1, 6)
        _record_change(patch, primary, "séries", old_sets, primary.sets)
        _sync_exercise_to_plan_json(plan, workout, primary)
        return patch

    if patch.adaptation_type == "volume_reduction":
        accessory = exercises[-1]
        old_sets = accessory.sets
        accessory.sets = max(2, old_sets - 1)
        _record_change(patch, accessory, "séries", old_sets, accessory.sets)
        _sync_exercise_to_plan_json(plan, workout, accessory)
        return patch

    if patch.adaptation_type == "deload":
        for exercise in exercises:
            old_rest = exercise.rest_seconds
            exercise.rest_seconds = min(old_rest + 15, 180)
            _record_change(patch, exercise, "descanso (s)", old_rest, exercise.rest_seconds)
            _sync_exercise_to_plan_json(plan, workout, exercise)
        return patch

    return patch


def _self_check() -> None:
    effort_session = WorkoutSession(
        completed=True,
        perceived_effort=5,
        difficulty_level=4,
        energy_level=7,
        soreness_level=3,
    )
    easy = decide_adaptation(effort_session)
    assert easy is not None and easy.adaptation_type == "volume_increase"

    heavy = decide_adaptation(
        WorkoutSession(
            completed=True,
            perceived_effort=9,
            difficulty_level=7,
            energy_level=6,
            soreness_level=5,
        )
    )
    assert heavy is not None and heavy.adaptation_type == "volume_reduction"

    skipped = decide_adaptation(WorkoutSession(completed=False))
    assert skipped is not None and skipped.adaptation_type == "volume_reduction"

    ok = decide_adaptation(
        WorkoutSession(
            completed=True,
            perceived_effort=7,
            difficulty_level=6,
            energy_level=7,
            soreness_level=5,
        )
    )
    assert ok is None


if __name__ == "__main__":
    _self_check()
    print("adaptation self-check OK")
