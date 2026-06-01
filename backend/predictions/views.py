from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.views import APIView
from core.models import Prediction, Follow
from core.throttles import PredictionRateThrottle
from .serializers import PlacePredictionSerializer, PredictionSerializer, FeedPredictionSerializer, ResolveEventSerializer
from .services import place_prediction, resolve_event, PredictionError


class PlacePredictionView(APIView):
    permission_classes = (IsAuthenticated,)
    throttle_classes = (PredictionRateThrottle,)

    def post(self, request):
        serializer = PlacePredictionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            prediction = place_prediction(
                user=request.user,
                event_id=serializer.validated_data["event"],
                outcome_id=serializer.validated_data["selected_outcome"],
                amount_tokens=serializer.validated_data["amount_tokens"],
            )
            return Response(
                PredictionSerializer(prediction).data,
                status=status.HTTP_201_CREATED,
            )
        except PredictionError as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )


class UserPredictionsView(generics.ListAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = PredictionSerializer

    def get_queryset(self):
        return Prediction.objects.filter(
            user=self.request.user
        ).select_related("event", "selected_outcome").order_by("-created_at")


class FriendsFeedView(generics.ListAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = FeedPredictionSerializer
    pagination_class = None

    def get_queryset(self):
        following_ids = Follow.objects.filter(
            follower=self.request.user
        ).values_list("following_id", flat=True)
        return (
            Prediction.objects.filter(user_id__in=following_ids)
            .select_related("user", "event", "selected_outcome")
            .order_by("-created_at")[:50]
        )


class ResolveEventView(APIView):
    permission_classes = (IsAdminUser,)

    def post(self, request, event_id):
        serializer = ResolveEventSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            resolve_event(
                event_id=event_id,
                winning_outcome_id=serializer.validated_data["winning_outcome"],
            )
            return Response({"detail": "Event resolved successfully."})
        except PredictionError as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )
