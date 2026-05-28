import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.training import PlannedExercise, PlannedWorkout, TrainingPlan
from app.services.exercise_image_resolver import is_usable_image_url, resolve_exercise_image_url


async def enrich_planned_exercise(exercise: PlannedExercise) -> bool:
    if is_usable_image_url(exercise.image_url):
        return False

    try:
        image_url = await resolve_exercise_image_url(exercise.name)
    except Exception:
        return False

    if image_url and exercise.image_url != image_url:
        exercise.image_url = image_url
        return True
    return False


async def enrich_plan_exercises(db: AsyncSession, plan: TrainingPlan) -> bool:
    changed = False
    for workout in plan.workouts:
        for exercise in workout.exercises:
            if await enrich_planned_exercise(exercise):
                changed = True
    if changed:
        await db.flush()
    return changed


async def backfill_user_active_plan(db: AsyncSession, user_id: uuid.UUID) -> int:
    result = await db.execute(
        select(TrainingPlan)
        .options(selectinload(TrainingPlan.workouts).selectinload(PlannedWorkout.exercises))
        .where(TrainingPlan.user_id == user_id, TrainingPlan.is_active.is_(True))
        .limit(1)
    )
    plan = result.scalar_one_or_none()
    if not plan:
        return 0
    count = 0
    for workout in plan.workouts:
        for exercise in workout.exercises:
            if await enrich_planned_exercise(exercise):
                count += 1
    if count:
        await db.commit()
    return count
