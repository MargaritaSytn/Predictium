from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from django.db.models import Count, Sum, Q
from django.http import HttpResponse
from django.utils import timezone
from core.models import Event, EventOutcome, Review
from .serializers import (
    EventListSerializer, EventDetailSerializer,
    ReviewSerializer, CreateReviewSerializer,
    CreateEventSerializer, UpdateEventSerializer, AddOutcomeSerializer,
)


class EventListView(generics.ListAPIView):
    permission_classes = (AllowAny,)
    serializer_class = EventListSerializer

    def get_queryset(self):
        queryset = Event.objects.exclude(status="draft").annotate(
            prediction_count=Count("predictions"),
            review_count=Count("reviews", filter=Q(reviews__is_approved=True)),
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
            review_count=Count("reviews", filter=Q(reviews__is_approved=True)),
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


class EventReviewListView(generics.ListAPIView):
    permission_classes = (AllowAny,)
    serializer_class = ReviewSerializer
    pagination_class = None

    def get_queryset(self):
        return Review.objects.filter(
            event_id=self.kwargs["event_id"],
            is_approved=True,
        ).order_by("-created_at")


class CreateReviewView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request, event_id):
        event = Event.objects.filter(pk=event_id).first()
        if not event:
            return Response(
                {"detail": "Подію не знайдено."},
                status=status.HTTP_404_NOT_FOUND,
            )
        if Review.objects.filter(user=request.user, event=event).exists():
            return Response(
                {"detail": "Ви вже залишили відгук для цієї події."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = CreateReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        review = serializer.save(user=request.user, event=event)
        return Response(
            ReviewSerializer(review).data,
            status=status.HTTP_201_CREATED,
        )


class PendingReviewsView(generics.ListAPIView):
    permission_classes = (IsAdminUser,)
    serializer_class = ReviewSerializer

    def get_queryset(self):
        return Review.objects.filter(is_approved=False).order_by("-created_at")


class ApproveReviewView(APIView):
    permission_classes = (IsAdminUser,)

    def post(self, request, review_id):
        review = Review.objects.filter(pk=review_id).first()
        if not review:
            return Response(
                {"detail": "Відгук не знайдено."},
                status=status.HTTP_404_NOT_FOUND,
            )
        review.is_approved = True
        review.save(update_fields=["is_approved"])
        return Response(ReviewSerializer(review).data)


class RejectReviewView(APIView):
    permission_classes = (IsAdminUser,)

    def post(self, request, review_id):
        review = Review.objects.filter(pk=review_id).first()
        if not review:
            return Response(
                {"detail": "Відгук не знайдено."},
                status=status.HTTP_404_NOT_FOUND,
            )
        review.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ── Admin Event Management ────────────────────────────────────────────────────

class AdminEventListCreateView(generics.ListCreateAPIView):
    """Admin: list all events (including drafts) + create new event with outcomes."""
    permission_classes = (IsAdminUser,)

    def get_serializer_class(self):
        if self.request.method == "POST":
            return CreateEventSerializer
        return EventDetailSerializer

    def get_queryset(self):
        return Event.objects.annotate(
            prediction_count=Count("predictions"),
            review_count=Count("reviews", filter=Q(reviews__is_approved=True)),
            total_tokens_wagered=Sum("predictions__amount_tokens"),
        ).order_by("-created_at")

    def create(self, request, *args, **kwargs):
        serializer = CreateEventSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        event = serializer.save()
        annotated = Event.objects.annotate(
            prediction_count=Count("predictions"),
            review_count=Count("reviews", filter=Q(reviews__is_approved=True)),
            total_tokens_wagered=Sum("predictions__amount_tokens"),
        ).get(pk=event.pk)
        return Response(
            EventDetailSerializer(annotated).data,
            status=status.HTTP_201_CREATED,
        )


class AdminEventDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Admin: retrieve, update or delete a single event."""
    permission_classes = (IsAdminUser,)

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return UpdateEventSerializer
        return EventDetailSerializer

    def get_queryset(self):
        return Event.objects.annotate(
            prediction_count=Count("predictions"),
            review_count=Count("reviews", filter=Q(reviews__is_approved=True)),
            total_tokens_wagered=Sum("predictions__amount_tokens"),
        )


class AdminAddOutcomeView(APIView):
    """Admin: add an outcome to an existing event."""
    permission_classes = (IsAdminUser,)

    def post(self, request, event_id):
        event = Event.objects.filter(pk=event_id).first()
        if not event:
            return Response({"detail": "Подію не знайдено."}, status=status.HTTP_404_NOT_FOUND)
        serializer = AddOutcomeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        outcome = serializer.save(event=event)
        return Response(
            {"id": outcome.id, "label": outcome.label, "total_tokens_wagered": 0, "current_coefficient": 0.0},
            status=status.HTTP_201_CREATED,
        )


class AdminDeleteOutcomeView(APIView):
    """Admin: remove an outcome from an event."""
    permission_classes = (IsAdminUser,)

    def delete(self, request, outcome_id):
        outcome = EventOutcome.objects.filter(pk=outcome_id).first()
        if not outcome:
            return Response({"detail": "Варіант відповіді не знайдено."}, status=status.HTTP_404_NOT_FOUND)
        if outcome.total_tokens_wagered > 0:
            return Response(
                {"detail": "Не можна видалити варіант із зробленими ставками."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        outcome.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class EventICalView(APIView):
    """Return an iCal (.ics) file for an event deadline."""
    permission_classes = (AllowAny,)

    def get(self, request, pk):
        event = Event.objects.filter(pk=pk).first()
        if not event:
            return Response({"detail": "Подію не знайдено."}, status=status.HTTP_404_NOT_FOUND)

        now = timezone.now()
        uid = f"predictium-event-{event.id}@predictium.app"
        dtstart = event.deadline.strftime("%Y%m%dT%H%M%SZ")
        dtstamp = now.strftime("%Y%m%dT%H%M%SZ")
        created = event.created_at.strftime("%Y%m%dT%H%M%SZ")

        def esc(s):
            return s.replace("\\", "\\\\").replace(",", "\\,").replace(";", "\\;").replace("\n", "\\n")

        ical = (
            "BEGIN:VCALENDAR\r\n"
            "VERSION:2.0\r\n"
            "PRODID:-//Predictium//Predictium//EN\r\n"
            "CALSCALE:GREGORIAN\r\n"
            "METHOD:PUBLISH\r\n"
            "BEGIN:VEVENT\r\n"
            f"UID:{uid}\r\n"
            f"DTSTART:{dtstart}\r\n"
            f"DTEND:{dtstart}\r\n"
            f"DTSTAMP:{dtstamp}\r\n"
            f"CREATED:{created}\r\n"
            f"SUMMARY:{esc(event.title)}\r\n"
            f"DESCRIPTION:{esc(event.description[:500])}\r\n"
            "END:VEVENT\r\n"
            "END:VCALENDAR\r\n"
        )
        response = HttpResponse(ical, content_type="text/calendar; charset=utf-8")
        response["Content-Disposition"] = f'attachment; filename="event-{pk}.ics"'
        return response

