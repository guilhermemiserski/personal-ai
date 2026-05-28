import uuid
from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.training import WorkoutSession
from app.services.week_bounds import current_week_bounds


async def get_completed_session_this_week(
    db: AsyncSession,
    user_id: uuid.UUID,
    planned_workout_id: uuid.UUID,
    *,
    reference_date: date | None = None,
) -> WorkoutSession | None:
    week_start, week_end = current_week_bounds(reference_date)
    result = await db.execute(
        select(WorkoutSession)
        .where(
            WorkoutSession.user_id == user_id,
            WorkoutSession.planned_workout_id == planned_workout_id,
            WorkoutSession.completed.is_(True),
        )
        .order_by(WorkoutSession.finished_at.desc())
    )
    for session in result.scalars().all():
        finished = session.finished_at or session.started_at
        if finished and week_start <= finished.date() <= week_end:
            return session
    return None


async def has_completed_workout_this_week(
    db: AsyncSession,
    user_id: uuid.UUID,
    planned_workout_id: uuid.UUID,
) -> bool:
    session = await get_completed_session_this_week(db, user_id, planned_workout_id)
    return session is not None
