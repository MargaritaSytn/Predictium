from django.urls import path
from .views import (
    EventListView, EventDetailView, TopEventsView,
    EventReviewListView, CreateReviewView,
    PendingReviewsView, ApproveReviewView, RejectReviewView,
)

urlpatterns = [
    path("", EventListView.as_view(), name="event-list"),
    path("top/", TopEventsView.as_view(), name="top-events"),
    path("<int:pk>/", EventDetailView.as_view(), name="event-detail"),
    path("<int:event_id>/reviews/", EventReviewListView.as_view(), name="event-reviews"),
    path("<int:event_id>/reviews/create/", CreateReviewView.as_view(), name="create-review"),
    path("moderation/reviews/", PendingReviewsView.as_view(), name="pending-reviews"),
    path("moderation/reviews/<int:review_id>/approve/", ApproveReviewView.as_view(), name="approve-review"),
    path("moderation/reviews/<int:review_id>/reject/", RejectReviewView.as_view(), name="reject-review"),
]
