"""Resolve imagem de exercício: free-exercise-db → wger (timeout) → placeholder SVG."""

from __future__ import annotations

import asyncio
import html

from app.services.free_exercise_db import find_image_url as find_fedb_image
from app.services.wger import wger_client

WGER_TIMEOUT_SECONDS = 6.0


async def resolve_exercise_image_url(exercise_name: str) -> str:
    fedb = await find_fedb_image(exercise_name)
    if fedb:
        return fedb

    try:
        meta = await asyncio.wait_for(
            wger_client.find_by_name(exercise_name),
            timeout=WGER_TIMEOUT_SECONDS,
        )
        if meta and meta.get("image_url"):
            return str(meta["image_url"])
    except (asyncio.TimeoutError, Exception):
        pass

    return build_svg_data_url(exercise_name)


def build_svg_data_url(exercise_name: str) -> str:
    svg = build_svg_placeholder(exercise_name)
    return "data:image/svg+xml;charset=utf-8," + _svg_to_data_uri_component(svg)


def build_svg_placeholder(exercise_name: str) -> str:
    label = exercise_name.strip()[:32] or "Exercício"
    safe = html.escape(label)
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <rect width="128" height="128" rx="12" fill="#0f172a"/>
  <rect x="1" y="1" width="126" height="126" rx="11" fill="none" stroke="#334155"/>
  <circle cx="64" cy="44" r="18" fill="#1e3a5f" stroke="#3b82f6" stroke-width="2"/>
  <path d="M64 62 L64 88 M48 72 L80 72 M52 98 L76 98" stroke="#60a5fa" stroke-width="3" stroke-linecap="round"/>
  <text x="64" y="118" text-anchor="middle" fill="#93c5fd" font-family="system-ui,sans-serif" font-size="9" font-weight="600">{safe}</text>
</svg>"""


def _svg_to_data_uri_component(svg: str) -> str:
    import urllib.parse

    return urllib.parse.quote(svg)


def is_usable_image_url(url: str | None) -> bool:
    if not url:
        return False
    lowered = url.lower()
    if lowered.startswith("data:image/"):
        return True
    return any(
        host in lowered
        for host in ("wger.de", "githubusercontent.com", "raw.githubusercontent.com")
    )
