import re
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

from pydantic_settings import BaseSettings, SettingsConfigDict

# asyncpg does not accept libpq/psycopg2 query params (e.g. sslmode).
_ASYNCPG_STRIP_QUERY_KEYS = frozenset(
    {"sslmode", "sslcert", "sslkey", "sslrootcert", "channel_binding", "options"}
)


def normalize_database_url(url: str) -> tuple[str, dict[str, object]]:
    """Ensure async Postgres driver (asyncpg) and Neon-compatible SSL."""
    connect_args: dict[str, object] = {}
    normalized = url.strip()
    if not normalized or normalized.startswith("sqlite"):
        return normalized, connect_args

    scheme, _, remainder = normalized.partition("://")
    if scheme in {"postgres", "postgresql"} or scheme.startswith("postgresql+"):
        if scheme in {"postgres", "postgresql"}:
            normalized = f"postgresql+asyncpg://{remainder}"
        elif not scheme.endswith("+asyncpg"):
            normalized = f"postgresql+asyncpg://{remainder}"

        parsed = urlparse(normalized)
        query = parse_qs(parsed.query, keep_blank_values=True)
        sslmode = (query.pop("sslmode", [""])[0] or "").lower()
        needs_ssl = sslmode in {"require", "verify-ca", "verify-full", "prefer"}
        for key in list(query.keys()):
            if key.lower() in _ASYNCPG_STRIP_QUERY_KEYS:
                if key.lower() == "sslmode":
                    needs_ssl = True
                query.pop(key, None)

        clean_query = urlencode({k: v[0] for k, v in query.items() if v and v[0]}, doseq=False)
        normalized = urlunparse(parsed._replace(query=clean_query))

        # Safety net: SQLAlchemy forwards URL query params to asyncpg.connect().
        normalized = re.sub(r"([?&])sslmode=[^&]*&?", r"\1", normalized, flags=re.IGNORECASE)
        normalized = re.sub(r"([?&])channel_binding=[^&]*&?", r"\1", normalized, flags=re.IGNORECASE)
        normalized = normalized.replace("?&", "?").rstrip("?")

        host = parsed.hostname or ""
        if needs_ssl or host.endswith(".neon.tech"):
            connect_args["ssl"] = True

    return normalized, connect_args


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "sqlite+aiosqlite:///./personal_ai.db"
    jwt_secret: str = "dev-secret-change-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24
    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"
    groq_fallback_model: str = "llama-3.1-8b-instant"
    groq_request_timeout_seconds: float = 22.0
    groq_base_url: str = "https://api.groq.com/openai/v1"
    cors_origins: str = "http://localhost:3000"
    cookie_secure: bool | None = None
    wger_base_url: str = "https://wger.de"
    wger_language_id: int = 7

    @property
    def is_sqlite(self) -> bool:
        return self.database_url.startswith("sqlite")

    @property
    def resolved_cookie_secure(self) -> bool:
        if self.cookie_secure is not None:
            return self.cookie_secure
        return not self.is_sqlite

    def validate_production_secrets(self) -> None:
        if self.is_sqlite:
            return
        secret = self.jwt_secret.strip()
        insecure = {
            "",
            "dev-secret-change-in-production",
            "troque-isso-em-producao",
        }
        if secret in insecure or len(secret) < 32:
            raise RuntimeError(
                "JWT_SECRET must be a strong random value (32+ chars) for Postgres deployments."
            )

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def database_connect_args(self) -> dict[str, object]:
        _, connect_args = normalize_database_url(self.database_url)
        return connect_args

    @property
    def async_database_url(self) -> str:
        url, _ = normalize_database_url(self.database_url)
        return url


settings = Settings()
