import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.types import GUID, JsonType


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    profile: Mapped["UserProfile | None"] = relationship(back_populates="user", uselist=False)


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("users.id", ondelete="CASCADE"), unique=True
    )
    onboarding_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    display_name: Mapped[str | None] = mapped_column(String(120), nullable=True)

    age: Mapped[int | None] = mapped_column(Integer, nullable=True)
    biological_sex: Mapped[str | None] = mapped_column(String(20), nullable=True)
    height_cm: Mapped[float | None] = mapped_column(nullable=True)
    weight_kg: Mapped[float | None] = mapped_column(nullable=True)

    training_experience: Mapped[str | None] = mapped_column(String(50), nullable=True)
    primary_goal: Mapped[str | None] = mapped_column(String(50), nullable=True)
    days_per_week: Mapped[int | None] = mapped_column(Integer, nullable=True)
    session_duration_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    gym_access: Mapped[str | None] = mapped_column(String(50), nullable=True)

    injuries: Mapped[list | None] = mapped_column(JsonType, nullable=True)
    injury_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    preferred_style: Mapped[str | None] = mapped_column(String(50), nullable=True)

    can_pushups: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    can_squat: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    cardio_level: Mapped[str | None] = mapped_column(String(30), nullable=True)
    strength_level: Mapped[str | None] = mapped_column(String(30), nullable=True)

    extra: Mapped[dict | None] = mapped_column(JsonType, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    user: Mapped["User"] = relationship(back_populates="profile")
