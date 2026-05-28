def name_from_email(email: str) -> str:
    local = email.split("@")[0].strip()
    if not local:
        return "Atleta"
    cleaned = local.replace(".", " ").replace("_", " ").replace("-", " ")
    parts = [part.capitalize() for part in cleaned.split() if part]
    return " ".join(parts) if parts else "Atleta"


def resolve_display_name(profile_name: str | None, email: str) -> str:
    if profile_name and profile_name.strip():
        return profile_name.strip()
    return name_from_email(email)
