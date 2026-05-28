import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.types import GUID, JsonType


class TrainingPlan(Base):
    __tablename__ = "training_plans"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("users.id", ondelete="CASCADE"))
    is_active: Mapped[bool] = mapped_column(default=True)
    program_name: Mapped[str] = mapped_column(String(200))
    weekly_split: Mapped[str] = mapped_column(String(200))
    rationale: Mapped[str | None] = mapped_column(Text, nullable=True)
    plan_json: Mapped[dict] = mapped_column(JsonType)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    workouts: Mapped[list["PlannedWorkout"]] = relationship(back_populates="plan", cascade="all, delete-orphan")


class PlannedWorkout(Base):
    __tablename__ = "planned_workouts"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    plan_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("training_plans.id", ondelete="CASCADE"))
    week_number: Mapped[int] = mapped_column(Integer, default=1)
    day_index: Mapped[int] = mapped_column(Integer)
    day_label: Mapped[str] = mapped_column(String(100))
    estimated_minutes: Mapped[int] = mapped_column(Integer, default=60)

    plan: Mapped["TrainingPlan"] = relationship(back_populates="workouts")
    exercises: Mapped[list["PlannedExercise"]] = relationship(
        back_populates="workout", cascade="all, delete-orphan"
    )


class PlannedExercise(Base):
    __tablename__ = "planned_exercises"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    workout_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("planned_workouts.id", ondelete="CASCADE")
    )
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    name: Mapped[str] = mapped_column(String(200))
    muscle_group: Mapped[str | None] = mapped_column(String(100), nullable=True)
    sets: Mapped[int] = mapped_column(Integer)
    reps: Mapped[str] = mapped_column(String(30))
    rest_seconds: Mapped[int] = mapped_column(Integer, default=90)
    tempo: Mapped[str | None] = mapped_column(String(20), nullable=True)
    target_rpe: Mapped[int | None] = mapped_column(Integer, nullable=True)
    instructions: Mapped[str | None] = mapped_column(Text, nullable=True)
    video_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    wger_exercise_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    alternatives: Mapped[list | None] = mapped_column(JsonType, nullable=True)

    workout: Mapped["PlannedWorkout"] = relationship(back_populates="exercises")


class WorkoutSession(Base):
    __tablename__ = "workout_sessions"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("users.id", ondelete="CASCADE"))
    planned_workout_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("planned_workouts.id", ondelete="CASCADE")
    )
    status: Mapped[str] = mapped_column(String(20), default="in_progress")
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    perceived_effort: Mapped[int | None] = mapped_column(Integer, nullable=True)
    energy_level: Mapped[int | None] = mapped_column(Integer, nullable=True)
    soreness_level: Mapped[int | None] = mapped_column(Integer, nullable=True)
    difficulty_level: Mapped[int | None] = mapped_column(Integer, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    adaptation_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    exercise_logs: Mapped[list["SessionExerciseLog"]] = relationship(
        back_populates="session", cascade="all, delete-orphan"
    )


class SessionExerciseLog(Base):
    __tablename__ = "session_exercise_logs"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("workout_sessions.id", ondelete="CASCADE")
    )
    planned_exercise_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("planned_exercises.id", ondelete="CASCADE")
    )
    completed_sets: Mapped[int] = mapped_column(Integer, default=0)
    completed_reps: Mapped[str | None] = mapped_column(String(50), nullable=True)
    load_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    rpe: Mapped[int | None] = mapped_column(Integer, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    session: Mapped["WorkoutSession"] = relationship(back_populates="exercise_logs")


class BodyMetric(Base):
    __tablename__ = "body_metrics"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("users.id", ondelete="CASCADE"))
    weight_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    body_fat_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    measurements: Mapped[dict | None] = mapped_column(JsonType, nullable=True)
    photo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class CoachMessage(Base):
    __tablename__ = "coach_messages"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("users.id", ondelete="CASCADE"))
    role: Mapped[str] = mapped_column(String(20))
    content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class UserNotification(Base):
    __tablename__ = "user_notifications"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("users.id", ondelete="CASCADE"))
    type: Mapped[str] = mapped_column(String(30))
    title: Mapped[str] = mapped_column(String(200))
    body: Mapped[str] = mapped_column(Text)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class UserAchievement(Base):
    __tablename__ = "user_achievements"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("users.id", ondelete="CASCADE"))
    code: Mapped[str] = mapped_column(String(50))
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text)
    earned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
