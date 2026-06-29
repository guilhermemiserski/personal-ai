import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.deps import get_current_user
from app.database import get_db
from app.models.training import (
    PlannedWorkout,
    SessionExerciseLog,
    TrainingPlan,
    UserAchievement,
    UserNotification,
    WorkoutSession,
)
from app.models.user import User
from app.schemas.session import (
    ExerciseLogOut,
    SessionFeedbackRequest,
    SessionResponse,
    SessionStartRequest,
    SessionUpdateRequest,
)
from app.services.adaptation import build_adaptation_summary
from app.services.workout_completion import has_completed_workout_this_week

router = APIRouter(prefix="/me/sessions", tags=["sessions"])


def _to_response(session: WorkoutSession) -> SessionResponse:
    logs = [
        ExerciseLogOut(
            planned_exercise_id=str(log.planned_exercise_id),
            completed_sets=log.completed_sets,
            completed_reps=log.completed_reps,
            load_kg=log.load_kg,
            rpe=log.rpe,
            notes=log.notes,
        )
        for log in session.exercise_logs
    ]
    return SessionResponse(
        id=str(session.id),
        planned_workout_id=str(session.planned_workout_id),
        status=session.status,
        completed=session.completed,
        perceived_effort=session.perceived_effort,
        energy_level=session.energy_level,
        soreness_level=session.soreness_level,
        difficulty_level=session.difficulty_level,
        notes=session.notes,
        adaptation_summary=session.adaptation_summary,
        started_at=session.started_at,
        finished_at=session.finished_at,
        exercise_logs=logs,
    )


async def _session_with_logs(db: AsyncSession, session_id: uuid.UUID) -> WorkoutSession:
    result = await db.execute(
        select(WorkoutSession)
        .where(WorkoutSession.id == session_id)
        .options(selectinload(WorkoutSession.exercise_logs))
    )
    return result.scalar_one()


@router.post("", response_model=SessionResponse)
async def start_session(
    body: SessionStartRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SessionResponse:
    try:
        workout_id = uuid.UUID(body.planned_workout_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="planned_workout_id inválido") from exc

    workout_result = await db.execute(
        select(PlannedWorkout, TrainingPlan.user_id)
        .join(TrainingPlan, PlannedWorkout.plan_id == TrainingPlan.id)
        .where(PlannedWorkout.id == workout_id)
        .options(selectinload(PlannedWorkout.exercises))
    )
    row = workout_result.first()
    if row is None:
        raise HTTPException(status_code=404, detail="Treino não encontrado")
    workout, owner_user_id = row
    if owner_user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Treino não encontrado")

    if await has_completed_workout_this_week(db, current_user.id, workout.id):
        raise HTTPException(
            status_code=409,
            detail="Este treino já foi concluído nesta semana.",
        )

    existing = await db.execute(
        select(WorkoutSession)
        .where(
            WorkoutSession.user_id == current_user.id,
            WorkoutSession.planned_workout_id == workout.id,
            WorkoutSession.status == "in_progress",
            WorkoutSession.completed.is_(False),
        )
        .options(selectinload(WorkoutSession.exercise_logs))
        .order_by(WorkoutSession.started_at.desc())
        .limit(1)
    )
    active_session = existing.scalar_one_or_none()
    if active_session is not None:
        return _to_response(active_session)

    session = WorkoutSession(
        user_id=current_user.id,
        planned_workout_id=workout.id,
        status="in_progress",
        completed=False,
    )
    db.add(session)
    await db.flush()

    for ex in workout.exercises:
        db.add(
            SessionExerciseLog(
                session_id=session.id,
                planned_exercise_id=ex.id,
                completed_sets=0,
            )
        )
    await db.flush()
    session = await _session_with_logs(db, session.id)
    return _to_response(session)


@router.patch("/{session_id}", response_model=SessionResponse)
async def update_session(
    session_id: str,
    body: SessionUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SessionResponse:
    try:
        sid = uuid.UUID(session_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="session_id inválido") from exc

    result = await db.execute(
        select(WorkoutSession)
        .where(WorkoutSession.id == sid, WorkoutSession.user_id == current_user.id)
        .options(selectinload(WorkoutSession.exercise_logs))
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Sessão não encontrada")
    if session.completed:
        raise HTTPException(status_code=409, detail="Esta sessão já foi finalizada.")

    logs_by_exercise = {str(log.planned_exercise_id): log for log in session.exercise_logs}
    for item in body.exercise_logs:
        log = logs_by_exercise.get(item.planned_exercise_id)
        if log is None:
            raise HTTPException(
                status_code=400,
                detail=f"Exercício não pertence a esta sessão: {item.planned_exercise_id}",
            )
        log.completed_sets = item.completed_sets
        log.completed_reps = item.completed_reps
        log.load_kg = item.load_kg
        log.rpe = item.rpe
        log.notes = item.notes

    await db.flush()
    return _to_response(session)


@router.post("/{session_id}/feedback", response_model=SessionResponse)
async def finish_session_with_feedback(
    session_id: str,
    body: SessionFeedbackRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SessionResponse:
    try:
        sid = uuid.UUID(session_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="session_id inválido") from exc

    result = await db.execute(
        select(WorkoutSession)
        .where(WorkoutSession.id == sid, WorkoutSession.user_id == current_user.id)
        .options(selectinload(WorkoutSession.exercise_logs))
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Sessão não encontrada")
    if session.completed:
        raise HTTPException(status_code=409, detail="Este treino já foi finalizado.")

    session.completed = body.completed
    session.status = "completed" if body.completed else "abandoned"
    session.perceived_effort = body.perceived_effort
    session.energy_level = body.energy_level
    session.soreness_level = body.soreness_level
    session.difficulty_level = body.difficulty_level
    session.notes = body.notes
    if session.finished_at is None:
        session.finished_at = datetime.now(UTC)
    session.adaptation_summary = build_adaptation_summary(session)

    summary_text = session.adaptation_summary or "Seu feedback foi registrado. Bom trabalho!"
    db.add(
        UserNotification(
            user_id=current_user.id,
            type="recovery",
            title="Treino concluído",
            body=summary_text,
        )
    )

    completed_count = await db.execute(
        select(WorkoutSession)
        .where(WorkoutSession.user_id == current_user.id, WorkoutSession.completed.is_(True))
        .order_by(WorkoutSession.finished_at.desc())
    )
    completed_sessions = completed_count.scalars().all()
    if len(completed_sessions) >= 5:
        has_achievement = await db.execute(
            select(UserAchievement).where(
                UserAchievement.user_id == current_user.id,
                UserAchievement.code == "streak_5",
            )
        )
        if has_achievement.scalar_one_or_none() is None:
            db.add(
                UserAchievement(
                    user_id=current_user.id,
                    code="streak_5",
                    title="Consistência 5x",
                    description="Você completou 5 treinos. Continue assim!",
                )
            )

    await db.flush()
    return _to_response(session)
