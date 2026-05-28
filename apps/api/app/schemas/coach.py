from datetime import datetime

from pydantic import BaseModel, Field


class CoachAskRequest(BaseModel):
    message: str = Field(min_length=2, max_length=2000)


class CoachMessageResponse(BaseModel):
    id: str
    role: str
    content: str
    created_at: datetime
