from django.conf import settings
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


class _TestBypassMixin:
    """Skip throttling entirely when running Django tests."""

    def allow_request(self, request, view):
        if getattr(settings, "TESTING", False):
            return True
        return super().allow_request(request, view)


class LoginRateThrottle(_TestBypassMixin, AnonRateThrottle):
    scope = "login"


class RegisterRateThrottle(_TestBypassMixin, AnonRateThrottle):
    scope = "register"


class PredictionRateThrottle(_TestBypassMixin, UserRateThrottle):
    scope = "prediction"


class HintRateThrottle(_TestBypassMixin, UserRateThrottle):
    scope = "hint"


class WithdrawRateThrottle(_TestBypassMixin, UserRateThrottle):
    scope = "withdraw"
