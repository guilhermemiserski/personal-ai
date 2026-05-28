from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.deps import get_current_user
from app.core.user_display import resolve_display_name
from app.database import get_db
from app.models.training import PlannedWorkout, TrainingPlan
from app.models.user import User, UserProfile
from app.schemas.plan import PlanSummary
from app.schemas.profile import ProfileResponse, ProfileUpdate
from app.routers.plans import build_plan_summary
from app.services.groq_ai import groq_plan_service
from app.services.plan_persistence import persist_plan

router = APIRouter(prefix="/me", tags=["profile"])


def _profile_to_response(profile: UserProfile, email: str) -> ProfileResponse:
    return ProfileResponse(
        onboarding_completed=profile.onboarding_completed,
        display_name=resolve_display_name(profile.display_name, email),
        age=profile.age,
        biological_sex=profile.biological_sex,
        height_cm=profile.height_cm,
        weight_kg=profile.weight_kg,
        training_experience=profile.training_experience,
        primary_goal=profile.primary_goal,
        days_per_week=profile.days_per_week,
        session_duration_minutes=profile.session_duration_minutes,
        gym_access=profile.gym_access,
        injuries=profile.injuries,
        injury_notes=profile.injury_notes,
        preferred_style=profile.preferred_style,
        can_pushups=profile.can_pushups,
        can_squat=profile.can_squat,
        cardio_level=profile.cardio_level,
        strength_level=profile.strength_level,
    )


@router.get("/profile", response_model=ProfileResponse)
async def get_profile(current_user: User = Depends(get_current_user)) -> ProfileResponse:
    if not current_user.profile:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")
    return _profile_to_response(current_user.profile, current_user.email)


@router.patch("/profile", response_model=ProfileResponse)
async def update_profile(
    body: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProfileResponse:
    profile = current_user.profile
    if not profile:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)
        await db.flush()

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)

    await db.flush()
    return _profile_to_response(profile, current_user.email)


@router.post("/onboarding/complete", response_model=PlanSummary)
async def complete_onboarding(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PlanSummary:
    profile = current_user.profile
    if not profile:
        raise HTTPException(status_code=400, detail="Complete o perfil antes de finalizar.")

    required = [
        profile.age,
        profile.primary_goal,
        profile.days_per_week,
        profile.session_duration_minutes,
        profile.gym_access,
        profile.training_experience,
    ]
    if any(v is None for v in required):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Preencha todas as etapas obrigatórias do onboarding.",
        )

    profile.onboarding_completed = True
    plan_data = await groq_plan_service.generate_plan(profile)
    plan = await persist_plan(db, current_user.id, plan_data)

    loaded = await db.execute(
        select(TrainingPlan)
        .options(selectinload(TrainingPlan.workouts).selectinload(PlannedWorkout.exercises))
        .where(TrainingPlan.id == plan.id)
    )
    full_plan = loaded.scalar_one()
    return build_plan_summary(full_plan)
