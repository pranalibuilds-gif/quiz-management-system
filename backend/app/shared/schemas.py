from typing import Generic, TypeVar, Optional, Any
from pydantic import BaseModel

T = TypeVar("T")


class APIResponse(BaseModel, Generic[T]):
    success: bool
    message: str
    data: Optional[T] = None
    meta: Optional[dict[str, Any]] = None


class ErrorResponse(BaseModel):
    success: bool = False
    message: str
    errors: Optional[Any] = None
