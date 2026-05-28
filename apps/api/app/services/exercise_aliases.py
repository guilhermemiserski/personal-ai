"""Termos de busca em inglês para nomes comuns de exercícios em português (wger)."""

import re
import unicodedata


def normalize_text(value: str) -> str:
    lowered = value.lower().strip()
    without_accents = "".join(
        c for c in unicodedata.normalize("NFKD", lowered) if not unicodedata.combining(c)
    )
    return re.sub(r"[^a-z0-9\s]", " ", without_accents)

EXERCISE_SEARCH_ALIASES: dict[str, str] = {
    "agachamento livre": "barbell squat",
    "agachamento": "squat",
    "supino reto": "bench press",
    "supino inclinado": "incline bench press",
    "supino": "bench press",
    "remada curvada": "bent over row",
    "remada baixa": "cable row",
    "remada": "row",
    "puxada frontal": "lat pulldown",
    "puxada frente": "lat pulldown",
    "puxada": "lat pulldown",
    "leg press": "leg press",
    "levantamento terra romeno": "romanian deadlift",
    "levantamento terra": "deadlift",
    "terra": "deadlift",
    "desenvolvimento militar": "overhead press",
    "desenvolvimento": "shoulder press",
    "prancha": "plank",
    "prancha lateral": "side plank",
    "flexao de braco": "push up",
    "flexao": "push up",
    "rosca direta": "biceps curl",
    "rosca martelo": "hammer curl",
    "triceps corda": "triceps pushdown",
    "triceps testa": "skull crusher",
    "crucifixo": "dumbbell fly",
    "cadeira extensora": "leg extension",
    "cadeira flexora": "leg curl",
    "mesa flexora": "leg curl",
    "stiff": "romanian deadlift",
    "afundo": "lunge",
    "elevacao lateral": "lateral raise",
    "elevation lateral": "lateral raise",
    "panturrilha em pe": "calf raise",
    "abdominal": "crunch",
    "abdominal infra": "leg raise",
    "dead bug": "dead bug",
    "ab wheel": "ab rollout",
    "face pull": "face pull",
    "panturrilha em pe": "standing calf raise",
    "panturrilha": "calf raise",
    "desenvolvimento com halteres": "dumbbell shoulder press",
    "triceps testa": "lying triceps extension",
    "crucifixo": "dumbbell flye",
    "elevacao lateral": "dumbbell lateral raise",
    "elevacao frontal": "front raise",
    "barra fixa": "pull up",
    "paralelas": "dip",
}


def search_terms_for_exercise(name: str) -> list[str]:
    normalized = normalize_text(name)
    terms: list[str] = [name.strip()]
    alias = EXERCISE_SEARCH_ALIASES.get(normalized)
    if alias and alias not in terms:
        terms.append(alias)
    return terms
