from pydantic import BaseModel


class ExerciseOut(BaseModel):
    id: str
    name: str
    muscle_group: str | None
    sets: int
    reps: str
    rest_seconds: int
    tempo: str | None
    target_rpe: int | None
    instructions: str | None
    video_url: str | None
    image_url: str | None
    alternatives: list[str] | None


class WorkoutOut(BaseModel):
    id: str
    day_label: str
    day_index: int
    week_number: int
    estimated_minutes: int
    exercises: list[ExerciseOut]
    is_completed: bool = False
    completed_at: str | None = None
    adaptation_summary: str | None = None


class PlanSummary(BaseModel):
    id: str
    program_name: str
    weekly_split: str
    rationale: str | None
    workouts: list[WorkoutOut]
