import re

_MAX_COACH_MESSAGE_LEN = 2000
_CONTROL_CHARS = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")


def sanitize_coach_message(message: str) -> str:
    cleaned = _CONTROL_CHARS.sub("", message.strip())
    if len(cleaned) > _MAX_COACH_MESSAGE_LEN:
        cleaned = cleaned[:_MAX_COACH_MESSAGE_LEN]
    return cleaned
