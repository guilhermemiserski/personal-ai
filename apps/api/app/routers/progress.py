from collections import defaultdict
from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.database import get_db
from app.models.training import BodyMetric, SessionExerciseLog, WorkoutSession
from app.models.user import User
from app.schemas.progress import BodyMetricInput, BodyMetricResponse, ProgressPoint, ProgressSummary
from app.services.week_bounds import current_week_bounds

router = APIRouter(prefix="/me", tags=["progress"])


@router.post("/metrics", response_model=BodyMetricResponse)
async def create_metric(
    body: BodyMetricInput,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> BodyMetricResponse:
    metric = BodyMetric(
        user_id=current_user.id,
        weight_kg=body.weight_kg,
        body_fat_pct=body.body_fat_pct,
        measurements=body.measurements,
        photo_url=body.photo_url,
    )
    db.add(metric)
    await db.flush()
    return BodyMetricResponse(
        id=str(metric.id),
        weight_kg=metric.weight_kg,
        body_fat_pct=metric.body_fat_pct,
        measurements=metric.measurements,
        photo_url=metric.photo_url,
        created_at=metric.created_at,
    )


@router.get("/progress", response_model=ProgressSummary)
async def get_progress(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProgressSummary:
    sessions_result = await db.execute(
        select(WorkoutSession)
        .where(WorkoutSession.user_id == current_user.id)
        .order_by(WorkoutSession.started_at.asc())
    )
    sessions = sessions_result.scalars().all()
    completed_sessions = [s for s in sessions if s.completed]
    adherence = (len(completed_sessions) / len(sessions) * 100) if sessions else 0.0

    metrics_result = await db.execute(
        select(BodyMetric)
        .where(BodyMetric.user_id == current_user.id)
        .order_by(BodyMetric.created_at.asc())
    )
    metrics = metrics_result.scalars().all()

    weight_progression = [
        ProgressPoint(date=m.created_at.date().isoformat(), value=m.weight_kg)
        for m in metrics
        if m.weight_kg is not None
    ]

    sessions_by_day: dict[str, int] = defaultdict(int)
    for s in completed_sessions:
        sessions_by_day[s.started_at.date().isoformat()] += 1
    consistency_progression = [
        ProgressPoint(date=day, value=count) for day, count in sorted(sessions_by_day.items())
    ]

    volume_result = await db.execute(
        select(SessionExerciseLog).join(WorkoutSession).where(WorkoutSession.user_id == current_user.id)
    )
    logs = volume_result.scalars().all()
    total_volume = 0.0
    for log in logs:
        if log.load_kg is not None and log.completed_sets > 0:
            total_volume += log.load_kg * float(log.completed_sets)

    streak_days = _compute_streak_days(completed_sessions)
    week_start, week_end = current_week_bounds(date.today())
    completed_workout_ids = sorted(
        {
            str(session.planned_workout_id)
            for session in completed_sessions
            if week_start <= session.started_at.date() <= week_end
        }
    )

    return ProgressSummary(
        adherence_pct=round(adherence, 1),
        completed_workouts=len(completed_sessions),
        total_sessions=len(sessions),
        streak_days=streak_days,
        total_volume_kg=round(total_volume, 2),
        latest_weight_kg=weight_progression[-1].value if weight_progression else None,
        weight_progression=weight_progression,
        consistency_progression=consistency_progression,
        completed_workout_ids=completed_workout_ids,
    )




def _compute_streak_days(completed_sessions: list[WorkoutSession]) -> int:
    if not completed_sessions:
        return 0
    unique_days = sorted({s.started_at.date() for s in completed_sessions}, reverse=True)
    streak = 0
    cursor = date.today()
    for day in unique_days:
        if day == cursor:
            streak += 1
            cursor = date.fromordinal(cursor.toordinal() - 1)
            continue
        if streak == 0 and day == date.fromordinal(cursor.toordinal() - 1):
            streak += 1
            cursor = date.fromordinal(day.toordinal() - 1)
            continue
        if day < cursor:
            break
    return streak
