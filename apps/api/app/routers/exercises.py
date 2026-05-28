from typing import Any
from urllib.parse import unquote

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse, Response

from app.core.deps import get_current_user
from app.models.user import User
from app.services.exercise_image_resolver import build_svg_placeholder, resolve_exercise_image_url
from app.services.wger import wger_client

router = APIRouter(prefix="/exercises", tags=["exercises"])


@router.get("/thumbnail")
async def exercise_thumbnail(
    name: str = Query(..., min_length=1, max_length=120),
) -> Response:
    """Imagem do exercício (público) — free-exercise-db, wger ou SVG gerado."""
    url = await resolve_exercise_image_url(name)
    if url.startswith("data:image/svg+xml"):
        if "," in url:
            svg = unquote(url.split(",", 1)[1])
        else:
            svg = build_svg_placeholder(name)
        return Response(content=svg, media_type="image/svg+xml", headers={"Cache-Control": "public, max-age=86400"})
    return RedirectResponse(url=url, status_code=302, headers={"Cache-Control": "public, max-age=86400"})


@router.get("/search")
async def search_exercises(
    q: str | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
    _user: User = Depends(get_current_user),
) -> dict[str, Any]:
    try:
        data = await wger_client.search_exercises(term=q, limit=limit, offset=offset)
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Falha ao consultar wger.de") from exc

    results = []
    for item in data.get("results", []):
        results.append(await wger_client.normalize_exercise_with_media(item))
    return {"count": data.get("count", len(results)), "results": results}


@router.get("/{exercise_id}")
async def get_exercise(
    exercise_id: int,
    _user: User = Depends(get_current_user),
) -> dict[str, Any]:
    try:
        raw = await wger_client.get_exercise(exercise_id)
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Falha ao consultar wger.de") from exc

    if not raw:
        raise HTTPException(status_code=404, detail="Exercício não encontrado")
    return await wger_client.normalize_exercise_with_media(raw)
