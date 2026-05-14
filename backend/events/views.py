from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from django.db.models import Count, Sum
from core.models import Event
from .serializers import EventListSerializer, EventDetailSerializer


class EventListView(generics.ListAPIView):
    permission_classes = (AllowAny,)
    serializer_class = EventListSerializer

    def get_queryset(self):
        queryset = Event.objects.exclude(status="draft").annotate(
            prediction_count=Count("predictions"),
            review_count=Count("reviews"),
        ).order_by("-created_at")

        category = self.request.query_params.get("category")
        if category:
            queryset = queryset.filter(category=category)

        event_status = self.request.query_params.get("status")
        if event_status:
            queryset = queryset.filter(status=event_status)

        return queryset


class EventDetailView(generics.RetrieveAPIView):
    permission_classes = (AllowAny,)
    serializer_class = EventDetailSerializer

    def get_queryset(self):
        return Event.objects.annotate(
            prediction_count=Count("predictions"),
            review_count=Count("reviews"),
            total_tokens_wagered=Sum("predictions__amount_tokens"),
        )


class TopEventsView(APIView):
    permission_classes = (AllowAny,)

    def get(self, request):
        most_popular = Event.objects.filter(status="open").annotate(
            prediction_count=Count("predictions")
        ).order_by("-prediction_count")[:5]

        most_discussed = Event.objects.filter(status="open").annotate(
            review_count=Count("reviews")
        ).order_by("-review_count")[:5]

        most_predicted = Event.objects.filter(status="open").annotate(
            total_wagered=Sum("predictions__amount_tokens")
        ).order_by("-total_wagered")[:5]

        return Response({
            "most_popular": EventListSerializer(most_popular, many=True).data,
            "most_discussed": EventListSerializer(most_discussed, many=True).data,
            "most_predicted": EventListSerializer(most_predicted, many=True).data,
        })
