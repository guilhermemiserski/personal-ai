from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cookies import clear_auth_cookie, set_auth_cookie
from app.core.deps import get_current_user
from app.core.security import create_access_token, hash_password, verify_password
from app.core.user_display import name_from_email, resolve_display_name
from app.database import get_db
from app.models.user import User, UserProfile
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    body: RegisterRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    existing = await db.execute(select(User).where(User.email == body.email.lower()))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="E-mail já cadastrado")

    user = User(email=body.email.lower(), hashed_password=hash_password(body.password))
    db.add(user)
    await db.flush()
    display_name = (
        body.display_name.strip()
        if body.display_name and body.display_name.strip()
        else name_from_email(body.email)
    )
    db.add(UserProfile(user_id=user.id, display_name=display_name))
    await db.flush()

    token = create_access_token(str(user.id))
    set_auth_cookie(response, token)
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
async def login(
    body: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    result = await db.execute(select(User).where(User.email == body.email.lower()))
    user = result.scalar_one_or_none()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="E-mail ou senha inválidos")

    token = create_access_token(str(user.id))
    set_auth_cookie(response, token)
    return TokenResponse(access_token=token)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(response: Response) -> None:
    clear_auth_cookie(response)


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)) -> UserResponse:
    profile = current_user.profile
    onboarding = bool(profile and profile.onboarding_completed)
    display_name = resolve_display_name(
        profile.display_name if profile else None,
        current_user.email,
    )
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        display_name=display_name,
        onboarding_completed=onboarding,
    )
