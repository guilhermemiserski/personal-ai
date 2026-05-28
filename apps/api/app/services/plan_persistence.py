import uuid
from typing import Any

from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.training import PlannedExercise, PlannedWorkout, TrainingPlan
from app.services.exercise_image_resolver import resolve_exercise_image_url
from app.services.plan_utils import normalize_alternatives
from app.services.wger import wger_client

VIDEO_FALLBACKS: dict[str, str] = {
    "agachamento livre": "https://www.youtube.com/results?search_query=agachamento+livre+execucao",
    "supino reto": "https://www.youtube.com/results?search_query=supino+reto+execucao",
    "remada curvada": "https://www.youtube.com/results?search_query=remada+curvada+execucao",
    "puxada frente": "https://www.youtube.com/results?search_query=puxada+frente+execucao",
    "leg press": "https://www.youtube.com/results?search_query=leg+press+execucao",
    "levantamento terra romeno": "https://www.youtube.com/results?search_query=terra+romeno+execucao",
    "desenvolvimento militar": "https://www.youtube.com/results?search_query=desenvolvimento+militar+execucao",
}


def _youtube_search_url(exercise_name: str) -> str:
    from urllib.parse import quote_plus

    query = quote_plus(f"{exercise_name} execução exercício")
    return f"https://www.youtube.com/results?search_query={query}"


def _sanitize_media_url(url: str | None, *, max_len: int = 2048) -> str | None:
    """Avoid DB overflow; never persist inline data-URI placeholders."""
    if not url:
        return None
    cleaned = url.strip()
    if cleaned.startswith("data:"):
        return None
    if len(cleaned) > max_len:
        return cleaned[:max_len]
    return cleaned


async def deactivate_user_plans(db: AsyncSession, user_id: uuid.UUID) -> None:
    await db.execute(
        update(TrainingPlan).where(TrainingPlan.user_id == user_id).values(is_active=False)
    )


async def persist_plan(
    db: AsyncSession,
    user_id: uuid.UUID,
    plan_data: dict[str, Any],
    *,
    enrich_media: bool = False,
) -> TrainingPlan:
    await deactivate_user_plans(db, user_id)

    program_name = plan_data.get("program_name", "Meu plano")
    weekly_split = plan_data.get("weekly_split", "")
    rationale = plan_data.get("rationale")

    plan = TrainingPlan(
        user_id=user_id,
        is_active=True,
        program_name=program_name,
        weekly_split=weekly_split,
        rationale=rationale,
        plan_json=plan_data,
    )
    db.add(plan)
    await db.flush()

    weeks = plan_data.get("weeks") or []
    week1 = weeks[0] if weeks else {"days": []}
    days = week1.get("days") or []

    for day_index, day in enumerate(days):
        workout = PlannedWorkout(
            plan_id=plan.id,
            week_number=1,
            day_index=day_index,
            day_label=day.get("day_label", f"Dia {day_index + 1}"),
            estimated_minutes=int(day.get("estimated_minutes", 60)),
        )
        db.add(workout)
        await db.flush()

        for sort_order, ex in enumerate(day.get("exercises") or []):
            exercise_name = str(ex.get("name", "Exercício"))
            wger_meta: dict[str, Any] | None = None
            if enrich_media:
                try:
                    wger_meta = await wger_client.find_by_name(exercise_name)
                except Exception:
                    wger_meta = None

            image_url = _sanitize_media_url(ex.get("image_url"))
            if enrich_media and not image_url:
                try:
                    image_url = _sanitize_media_url(await resolve_exercise_image_url(exercise_name))
                except Exception:
                    image_url = None

            video_url = _sanitize_media_url(
                (wger_meta.get("video_url") if wger_meta else None)
                or ex.get("video_url")
                or VIDEO_FALLBACKS.get(exercise_name.lower())
                or _youtube_search_url(exercise_name)
            )

            db.add(
                PlannedExercise(
                    workout_id=workout.id,
                    sort_order=sort_order,
                    name=exercise_name,
                    muscle_group=ex.get("muscle_group")
                    or (wger_meta.get("muscle_group") if wger_meta else None),
                    sets=int(ex.get("sets", 3)),
                    reps=str(ex.get("reps", "8-12")),
                    rest_seconds=int(ex.get("rest_seconds", 90)),
                    tempo=ex.get("tempo"),
                    target_rpe=ex.get("target_rpe"),
                    instructions=ex.get("instructions")
                    or (wger_meta.get("instructions") if wger_meta else None),
                    video_url=video_url,
                    image_url=image_url,
                    wger_exercise_id=wger_meta.get("wger_id") if wger_meta else None,
                    alternatives=normalize_alternatives(ex.get("alternatives")),
                )
            )

    await db.flush()
    return plan
