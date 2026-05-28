from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from app.config import settings
from app.database import Base, engine
from app.routers import auth, coach, exercises, notifications, plans, profile, progress, sessions


def _migrate_sqlite_columns(sync_conn) -> None:
    if sync_conn.dialect.name != "sqlite":
        return
    inspector = inspect(sync_conn)
    if "user_profiles" not in inspector.get_table_names():
        return
    columns = {column["name"] for column in inspector.get_columns("user_profiles")}
    if "display_name" not in columns:
        sync_conn.execute(text("ALTER TABLE user_profiles ADD COLUMN display_name VARCHAR(120)"))


def _migrate_postgres_columns(sync_conn) -> None:
    if sync_conn.dialect.name != "postgresql":
        return
    inspector = inspect(sync_conn)
    if "planned_exercises" not in inspector.get_table_names():
        return
    column_types = {
        column["name"]: str(column["type"]).lower() for column in inspector.get_columns("planned_exercises")
    }
    if "varchar" in column_types.get("image_url", ""):
        sync_conn.execute(text("ALTER TABLE planned_exercises ALTER COLUMN image_url TYPE TEXT"))
    if "varchar" in column_types.get("video_url", ""):
        sync_conn.execute(text("ALTER TABLE planned_exercises ALTER COLUMN video_url TYPE TEXT"))


@asynccontextmanager
async def lifespan(_app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.run_sync(_migrate_sqlite_columns)
        await conn.run_sync(_migrate_postgres_columns)
    yield
    await engine.dispose()


app = FastAPI(
    title="Personal AI Trainer API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(plans.router)
app.include_router(exercises.router)
app.include_router(sessions.router)
app.include_router(progress.router)
app.include_router(coach.router)
app.include_router(notifications.router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
