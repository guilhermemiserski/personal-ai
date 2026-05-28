from datetime import date, timedelta


def current_week_bounds(today: date | None = None) -> tuple[date, date]:
    reference = today or date.today()
    week_start = reference - timedelta(days=reference.weekday())
    week_end = week_start + timedelta(days=6)
    return week_start, week_end
