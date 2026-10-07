class DomainError(Exception):
    """A rule of the product was broken; the message is safe to show to the user."""

    status_code = 400

    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


class NotFound(DomainError):
    status_code = 404


class Conflict(DomainError):
    status_code = 409


class RateLimited(DomainError):
    status_code = 429
