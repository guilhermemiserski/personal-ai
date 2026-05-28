"""Catálogo free-exercise-db (GitHub) — imagens estáveis via raw.githubusercontent.com."""

from __future__ import annotations

import asyncio
from typing import Any

import httpx

from app.services.exercise_aliases import normalize_text, search_terms_for_exercise
from app.services.wger import _match_score

INDEX_URL = (
    "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json"
)
IMAGE_BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/"

_index: list[dict[str, Any]] | None = None
_index_lock = asyncio.Lock()
MIN_MATCH_SCORE = 10


async def _ensure_index() -> list[dict[str, Any]]:
    global _index
    if _index is not None:
        return _index

    async with _index_lock:
        if _index is not None:
            return _index
        async with httpx.AsyncClient(timeout=45.0) as client:
            response = await client.get(INDEX_URL)
            response.raise_for_status()
            data = response.json()
            _index = data if isinstance(data, list) else []
    return _index


async def find_image_url(exercise_name: str) -> str | None:
    index = await _ensure_index()
    terms = search_terms_for_exercise(exercise_name)
    best_item: dict[str, Any] | None = None
    best_score = 0

    for item in index:
        candidate_name = str(item.get("name", ""))
        images = item.get("images") or []
        if not images:
            continue

        score = max(
            max(_match_score(term, candidate_name), _match_score(term, normalize_text(candidate_name)))
            for term in terms
        )
        if score > best_score:
            best_score = score
            best_item = item

    if not best_item or best_score < MIN_MATCH_SCORE:
        return None

    first_image = str(best_item["images"][0])
    return f"{IMAGE_BASE}{first_image}"
