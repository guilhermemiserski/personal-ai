from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.database import get_db
from app.models.training import CoachMessage, WorkoutSession
from app.models.user import User
from app.schemas.coach import CoachAskRequest, CoachMessageResponse
from app.services.groq_ai import groq_plan_service

router = APIRouter(prefix="/me/coach", tags=["coach"])


@router.get("/messages", response_model=list[CoachMessageResponse])
async def list_messages(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[CoachMessageResponse]:
    result = await db.execute(
        select(CoachMessage)
        .where(CoachMessage.user_id == current_user.id)
        .order_by(CoachMessage.created_at.asc())
        .limit(100)
    )
    messages = result.scalars().all()
    return [
        CoachMessageResponse(
            id=str(m.id),
            role=m.role,
            content=m.content,
            created_at=m.created_at,
        )
        for m in messages
    ]


@router.post("/messages", response_model=CoachMessageResponse)
async def ask_coach(
    body: CoachAskRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CoachMessageResponse:
    if not current_user.profile:
        raise HTTPException(status_code=400, detail="Perfil não encontrado")

    user_msg = CoachMessage(user_id=current_user.id, role="user", content=body.message)
    db.add(user_msg)
    await db.flush()

    sessions_result = await db.execute(
        select(WorkoutSession)
        .where(WorkoutSession.user_id == current_user.id)
        .order_by(WorkoutSession.started_at.desc())
        .limit(10)
    )
    recent_sessions = sessions_result.scalars().all()
    reply = await groq_plan_service.coach_reply(current_user.profile, body.message, recent_sessions)
    assistant_msg = CoachMessage(user_id=current_user.id, role="assistant", content=reply)
    db.add(assistant_msg)
    await db.flush()
    return CoachMessageResponse(
        id=str(assistant_msg.id),
        role=assistant_msg.role,
        content=assistant_msg.content,
        created_at=assistant_msg.created_at,
    )
