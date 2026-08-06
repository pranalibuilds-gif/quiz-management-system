from fastapi import APIRouter
from app.shared.schemas import APIResponse

router = APIRouter()


@router.get("/health", response_model=APIResponse[dict])
async def health_check():
    return APIResponse(
        success=True,
        message="System is healthy",
        data={"status": "ok"}
    )
