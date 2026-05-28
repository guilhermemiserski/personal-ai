from datetime import datetime

from pydantic import BaseModel, Field


class SessionStartRequest(BaseModel):
    planned_workout_id: str


class ExerciseLogInput(BaseModel):
    planned_exercise_id: str
    completed_sets: int = Field(ge=0, le=20)
    completed_reps: str | None = None
    load_kg: float | None = Field(default=None, ge=0)
    rpe: int | None = Field(default=None, ge=1, le=10)
    notes: str | None = None


class SessionUpdateRequest(BaseModel):
    exercise_logs: list[ExerciseLogInput]


class SessionFeedbackRequest(BaseModel):
    completed: bool
    perceived_effort: int = Field(ge=1, le=10)
    energy_level: int = Field(ge=1, le=10)
    soreness_level: int = Field(ge=1, le=10)
    difficulty_level: int = Field(ge=1, le=10)
    notes: str | None = None


class SessionResponse(BaseModel):
    id: str
    planned_workout_id: str
    status: str
    completed: bool
    perceived_effort: int | None = None
    energy_level: int | None = None
    soreness_level: int | None = None
    difficulty_level: int | None = None
    notes: str | None = None
    adaptation_summary: str | None = None
    started_at: datetime
    finished_at: datetime | None = None
