from pydantic import BaseModel
from app.users.schemas import UserRead


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserRead


class LoginRequest(BaseModel):
    identifier: str # Username or Email
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str
