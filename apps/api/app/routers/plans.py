import uuid
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.deps import get_current_user
from app.database import get_db
from app.models.training import PlannedWorkout, TrainingPlan, WorkoutSession
from app.models.user import User
from app.schemas.plan import ExerciseOut, PlanSummary, WorkoutOut
from app.services.exercise_media import backfill_user_active_plan
from app.services.workout_completion import get_completed_session_this_week

router = APIRouter(prefix="/me", tags=["plans"])


def build_plan_summary(plan: TrainingPlan) -> PlanSummary:
    workouts_out: list[WorkoutOut] = []
    for workout in sorted(plan.workouts, key=lambda w: w.day_index):
        exercises = [
            ExerciseOut(
                id=str(ex.id),
                name=ex.name,
                muscle_group=ex.muscle_group,
                sets=ex.sets,
                reps=ex.reps,
                rest_seconds=ex.rest_seconds,
                tempo=ex.tempo,
                target_rpe=ex.target_rpe,
                instructions=ex.instructions,
                video_url=ex.video_url,
                image_url=ex.image_url,
                alternatives=ex.alternatives,
            )
            for ex in sorted(workout.exercises, key=lambda e: e.sort_order)
        ]
        workouts_out.append(
            WorkoutOut(
                id=str(workout.id),
                day_label=workout.day_label,
                day_index=workout.day_index,
                week_number=workout.week_number,
                estimated_minutes=workout.estimated_minutes,
                exercises=exercises,
            )
        )

    return PlanSummary(
        id=str(plan.id),
        program_name=plan.program_name,
        weekly_split=plan.weekly_split,
        rationale=plan.rationale,
        workouts=workouts_out,
    )


def _apply_completion_to_workout(workout: WorkoutOut, session: WorkoutSession | None) -> WorkoutOut:
    if session is None:
        return workout
    finished = session.finished_at or session.started_at
    return workout.model_copy(
        update={
            "is_completed": True,
            "completed_at": finished.isoformat() if finished else None,
            "adaptation_summary": session.adaptation_summary,
        }
    )


async def _workout_out_with_completion(
    db: AsyncSession,
    user_id: uuid.UUID,
    workout: WorkoutOut,
) -> WorkoutOut:
    try:
        planned_id = uuid.UUID(workout.id)
    except ValueError:
        return workout
    session = await get_completed_session_this_week(db, user_id, planned_id)
    return _apply_completion_to_workout(workout, session)


@router.get("/plan/active", response_model=PlanSummary)
async def get_active_plan(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PlanSummary:
    result = await db.execute(
        select(TrainingPlan)
        .options(selectinload(TrainingPlan.workouts).selectinload(PlannedWorkout.exercises))
        .where(TrainingPlan.user_id == current_user.id, TrainingPlan.is_active.is_(True))
        .order_by(TrainingPlan.created_at.desc())
        .limit(1)
    )
    plan = result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="Nenhum plano ativo. Complete o onboarding.")
    return build_plan_summary(plan)


@router.post("/plan/enrich-images")
async def enrich_plan_images(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, int]:
    """Preenche image_url dos exercícios do plano ativo (free-exercise-db + wger)."""
    updated = await backfill_user_active_plan(db, current_user.id)
    return {"updated": updated}


@router.get("/workouts/today", response_model=WorkoutOut | None)
async def get_today_workout(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> WorkoutOut | None:
    result = await db.execute(
        select(TrainingPlan)
        .options(selectinload(TrainingPlan.workouts).selectinload(PlannedWorkout.exercises))
        .where(TrainingPlan.user_id == current_user.id, TrainingPlan.is_active.is_(True))
        .limit(1)
    )
    plan = result.scalar_one_or_none()
    if not plan or not plan.workouts:
        return None

    day_index = date.today().weekday() % len(plan.workouts)
    workout = sorted(plan.workouts, key=lambda w: w.day_index)[day_index]
    summary = build_plan_summary(plan)
    for w in summary.workouts:
        if w.id == str(workout.id):
            return await _workout_out_with_completion(db, current_user.id, w)
    first = summary.workouts[0] if summary.workouts else None
    return await _workout_out_with_completion(db, current_user.id, first) if first else None


@router.get("/workouts/{workout_id}", response_model=WorkoutOut)
async def get_workout_by_id(
    workout_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> WorkoutOut:
    result = await db.execute(
        select(TrainingPlan)
        .options(selectinload(TrainingPlan.workouts).selectinload(PlannedWorkout.exercises))
        .where(TrainingPlan.user_id == current_user.id, TrainingPlan.is_active.is_(True))
        .order_by(TrainingPlan.created_at.desc())
        .limit(1)
    )
    plan = result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="Nenhum plano ativo.")
    summary = build_plan_summary(plan)
    for workout in summary.workouts:
        if workout.id == workout_id:
            return await _workout_out_with_completion(db, current_user.id, workout)
    raise HTTPException(status_code=404, detail="Treino não encontrado.")
