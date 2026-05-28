from typing import Any


def normalize_alternatives(raw: Any) -> list[str] | None:
    """Groq may return alternatives as strings or {name, muscle_group} objects."""
    if raw is None:
        return None
    if not isinstance(raw, list):
        return None

    names: list[str] = []
    for item in raw:
        if isinstance(item, str):
            name = item.strip()
        elif isinstance(item, dict):
            name = str(item.get("name") or item.get("exercise") or "").strip()
        else:
            continue
        if name and name not in names:
            names.append(name)

    return names if names else None
