from pydantic import BaseModel, Field


class ProfileUpdate(BaseModel):
    display_name: str | None = Field(default=None, min_length=2, max_length=120)
    age: int | None = Field(default=None, ge=13, le=100)
    biological_sex: str | None = None
    height_cm: float | None = Field(default=None, gt=0)
    weight_kg: float | None = Field(default=None, gt=0)
    training_experience: str | None = None
    primary_goal: str | None = None
    days_per_week: int | None = Field(default=None, ge=1, le=7)
    session_duration_minutes: int | None = None
    gym_access: str | None = None
    injuries: list[str] | None = None
    injury_notes: str | None = None
    preferred_style: str | None = None
    can_pushups: bool | None = None
    can_squat: bool | None = None
    cardio_level: str | None = None
    strength_level: str | None = None


class ProfileResponse(ProfileUpdate):
    onboarding_completed: bool = False

    model_config = {"from_attributes": True}
