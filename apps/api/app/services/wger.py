import re
from typing import Any

import httpx

from app.config import settings
from app.services.exercise_aliases import normalize_text, search_terms_for_exercise

WGER_LANGUAGE_PT = 7
WGER_LANGUAGE_EN = 2
MIN_MATCH_SCORE = 10


class WgerClient:
    def __init__(self) -> None:
        self.base = settings.wger_base_url.rstrip("/")
        self.language_id = settings.wger_language_id or WGER_LANGUAGE_PT

    async def search_exercises(
        self,
        term: str | None = None,
        limit: int = 20,
        offset: int = 0,
        language_id: int | None = None,
    ) -> dict[str, Any]:
        params: dict[str, str | int] = {
            "language": language_id if language_id is not None else self.language_id,
            "limit": limit,
            "offset": offset,
        }
        if term:
            params["search"] = term

        async with httpx.AsyncClient(timeout=12.0) as client:
            response = await client.get(f"{self.base}/api/v2/exerciseinfo/", params=params)
            response.raise_for_status()
            return response.json()

    async def get_exercise(self, exercise_id: int) -> dict[str, Any] | None:
        async with httpx.AsyncClient(timeout=12.0) as client:
            response = await client.get(
                f"{self.base}/api/v2/exerciseinfo/{exercise_id}/",
                params={"language": self.language_id},
            )
            if response.status_code == 404:
                return None
            response.raise_for_status()
            return response.json()

    async def fetch_main_image(self, exercise_id: int | None) -> str | None:
        if not exercise_id:
            return None

        async with httpx.AsyncClient(timeout=12.0) as client:
            for is_main in (True, False):
                params: dict[str, str | int | bool] = {
                    "exercise": exercise_id,
                    "limit": 1,
                }
                if is_main:
                    params["is_main"] = True
                response = await client.get(f"{self.base}/api/v2/exerciseimage/", params=params)
                response.raise_for_status()
                results = response.json().get("results") or []
                if results:
                    image = results[0].get("image")
                    if image:
                        return str(image)
        return None

    @staticmethod
    def normalize_exercise(raw: dict[str, Any], image_url: str | None = None) -> dict[str, Any]:
        translations = raw.get("translations") or []
        pt_translation = next(
            (t for t in translations if t.get("language") == WGER_LANGUAGE_PT),
            None,
        )
        en_translation = next(
            (t for t in translations if t.get("language") == WGER_LANGUAGE_EN),
            None,
        )
        translation = pt_translation or en_translation or (translations[0] if translations else None)
        name = translation.get("name", "Exercício") if translation else "Exercício"
        description_html = translation.get("description", "") if translation else ""
        instructions = _strip_html(description_html)

        muscles = raw.get("muscles") or []
        muscle_group = muscles[0].get("name", "") if muscles else ""

        equipment_list = raw.get("equipment") or []
        equipment = ", ".join(e.get("name", "") for e in equipment_list if e.get("name"))

        images = raw.get("images") or []
        embedded_image = images[0].get("image") if images else None

        videos = raw.get("videos") or []
        video_url = videos[0].get("video") if videos else None

        return {
            "wger_id": raw.get("id"),
            "name": name,
            "muscle_group": muscle_group,
            "equipment": equipment,
            "instructions": instructions[:2000] if instructions else None,
            "image_url": image_url or embedded_image,
            "video_url": video_url,
        }

    async def normalize_exercise_with_media(self, raw: dict[str, Any]) -> dict[str, Any]:
        exercise_id = raw.get("id")
        embedded = (raw.get("images") or [{}])[0].get("image") if raw.get("images") else None
        image_url = embedded or await self.fetch_main_image(exercise_id)
        return self.normalize_exercise(raw, image_url=image_url)

    async def find_by_name(self, name: str) -> dict[str, Any] | None:
        terms = search_terms_for_exercise(name)
        ranked: list[tuple[int, dict[str, Any]]] = []
        seen_ids: set[int] = set()

        for term in terms:
            for language_id in (self.language_id, WGER_LANGUAGE_EN):
                try:
                    data = await self.search_exercises(
                        term=term,
                        limit=50,
                        language_id=language_id,
                    )
                except Exception:
                    continue

                for raw in data.get("results") or []:
                    exercise_id = raw.get("id")
                    if not isinstance(exercise_id, int) or exercise_id in seen_ids:
                        continue

                    preview = self.normalize_exercise(raw)
                    candidate_name = str(preview.get("name", ""))
                    score = max(_match_score(name, candidate_name), _match_score(term, candidate_name))
                    if score < MIN_MATCH_SCORE:
                        continue

                    seen_ids.add(exercise_id)
                    ranked.append((score, raw))

        if not ranked:
            return None

        ranked.sort(key=lambda item: item[0], reverse=True)
        for _, raw in ranked[:6]:
            enriched = await self.normalize_exercise_with_media(raw)
            if enriched.get("image_url"):
                return enriched

        return None


def _strip_html(html: str) -> str:
    text = re.sub(r"<[^>]+>", " ", html)
    return re.sub(r"\s+", " ", text).strip()


def _tokenize(value: str) -> set[str]:
    normalized = normalize_text(value)
    return {token for token in normalized.split() if len(token) >= 2}


def _match_score(input_name: str, candidate_name: str) -> int:
    normalized_input = normalize_text(input_name)
    normalized_candidate = normalize_text(candidate_name)
    if normalized_input == normalized_candidate:
        return 100

    input_tokens = _tokenize(input_name)
    candidate_tokens = _tokenize(candidate_name)
    common = len(input_tokens.intersection(candidate_tokens))
    score = common * 10

    if normalized_input in normalized_candidate:
        score += 8
    if normalized_candidate in normalized_input:
        score += 6
    return score


def _media_score(item: dict[str, Any]) -> int:
    score = 0
    if item.get("image_url"):
        score += 4
    if item.get("video_url"):
        score += 2
    if item.get("instructions"):
        score += 1
    return score


wger_client = WgerClient()
