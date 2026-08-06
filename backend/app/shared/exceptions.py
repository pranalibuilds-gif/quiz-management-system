class AppException(Exception):
    def __init__(self, message: str, status_code: int = 400, errors: any = None):
        self.message = message
        self.status_code = status_code
        self.errors = errors


class NotFoundException(AppException):
    def __init__(self, message: str = "Resource not found"):
        super().__init__(message, status_code=404)


class UnauthorizedException(AppException):
    def __init__(self, message: str = "Unauthorized access"):
        super().__init__(message, status_code=401)


class ForbiddenException(AppException):
    def __init__(self, message: str = "Forbidden"):
        super().__init__(message, status_code=403)


class ValidationException(AppException):
    def __init__(self, message: str = "Validation error", errors: any = None):
        super().__init__(message, status_code=422, errors=errors)
