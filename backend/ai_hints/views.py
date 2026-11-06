from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from core.throttles import HintRateThrottle

from .serializers import HintResponseSerializer, HintStatusSerializer
from .services import AIHintError, get_ai_hint, get_hint_status


class HintStatusView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        result = get_hint_status(request.user)
        return Response(HintStatusSerializer(result).data)


class AIHintView(APIView):
    permission_classes = (IsAuthenticated,)
    throttle_classes = (HintRateThrottle,)

    def post(self, request, event_id):
        try:
            result = get_ai_hint(request.user, event_id)
            return Response(HintResponseSerializer(result).data, status=status.HTTP_200_OK)
        except AIHintError as e:
            if e.code == "limit_reached":
                http_status = status.HTTP_429_TOO_MANY_REQUESTS
            elif e.code == "event_not_found":
                http_status = status.HTTP_404_NOT_FOUND
            else:
                http_status = status.HTTP_502_BAD_GATEWAY
            return Response({"detail": str(e)}, status=http_status)
