import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.database import get_db
from app.models.training import UserAchievement, UserNotification
from app.models.user import User

router = APIRouter(prefix="/me", tags=["notifications"])


def _serialize_notification(notification: UserNotification) -> dict[str, str | bool]:
    return {
        "id": str(notification.id),
        "type": notification.type,
        "title": notification.title,
        "body": notification.body,
        "is_read": notification.is_read,
        "created_at": notification.created_at.isoformat(),
    }


@router.get("/notifications")
async def list_notifications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, list[dict[str, str | bool]]]:
    result = await db.execute(
        select(UserNotification)
        .where(UserNotification.user_id == current_user.id)
        .order_by(UserNotification.created_at.desc())
        .limit(50)
    )
    notifications = result.scalars().all()
    return {
        "notifications": [_serialize_notification(n) for n in notifications],
    }


@router.patch("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, str | bool]:
    try:
        nid = uuid.UUID(notification_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="notification_id inválido") from exc

    result = await db.execute(
        select(UserNotification).where(
            UserNotification.id == nid,
            UserNotification.user_id == current_user.id,
        )
    )
    notification = result.scalar_one_or_none()
    if not notification:
        raise HTTPException(status_code=404, detail="Notificação não encontrada")

    notification.is_read = True
    await db.flush()
    return _serialize_notification(notification)


@router.post("/notifications/read-all")
async def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, int]:
    result = await db.execute(
        update(UserNotification)
        .where(
            UserNotification.user_id == current_user.id,
            UserNotification.is_read.is_(False),
        )
        .values(is_read=True)
    )
    await db.flush()
    return {"updated": result.rowcount or 0}


@router.get("/achievements")
async def list_achievements(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, list[dict[str, str]]]:
    result = await db.execute(
        select(UserAchievement)
        .where(UserAchievement.user_id == current_user.id)
        .order_by(UserAchievement.earned_at.desc())
    )
    achievements = result.scalars().all()
    return {
        "achievements": [
            {
                "id": str(a.id),
                "code": a.code,
                "title": a.title,
                "description": a.description,
                "earned_at": a.earned_at.isoformat(),
            }
            for a in achievements
        ]
    }
