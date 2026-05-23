from django.urls import path
from .views import EventListView, EventDetailView, TopEventsView

urlpatterns = [
    path("", EventListView.as_view(), name="event-list"),
    path("top/", TopEventsView.as_view(), name="top-events"),
    path("<int:pk>/", EventDetailView.as_view(), name="event-detail"),
]
