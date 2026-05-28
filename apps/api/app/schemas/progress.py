from datetime import datetime

from pydantic import BaseModel, Field


class BodyMetricInput(BaseModel):
    weight_kg: float | None = Field(default=None, ge=0)
    body_fat_pct: float | None = Field(default=None, ge=0, le=100)
    measurements: dict[str, float] | None = None
    photo_url: str | None = None


class BodyMetricResponse(BaseModel):
    id: str
    weight_kg: float | None = None
    body_fat_pct: float | None = None
    measurements: dict[str, float] | None = None
    photo_url: str | None = None
    created_at: datetime


class ProgressPoint(BaseModel):
    date: str
    value: float


class ProgressSummary(BaseModel):
    adherence_pct: float
    completed_workouts: int
    total_sessions: int
    streak_days: int
    total_volume_kg: float
    latest_weight_kg: float | None
    weight_progression: list[ProgressPoint]
    consistency_progression: list[ProgressPoint]
    completed_workout_ids: list[str] = []
