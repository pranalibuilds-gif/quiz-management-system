from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from app.shared.exceptions import AppException
from app.shared.schemas import ErrorResponse


async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            success=False,
            message=exc.message,
            errors=exc.errors
        ).model_dump()
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=ErrorResponse(
            success=False,
            message="Validation error",
            errors=exc.errors()
        ).model_dump()
    )


async def global_exception_handler(request: Request, exc: Exception):
    # Log the full exception here in a real app
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ErrorResponse(
            success=False,
            message="Internal server error",
            errors=str(exc) if True else None # Set False in production
        ).model_dump()
    )
