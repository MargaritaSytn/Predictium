from django.contrib import admin
from django.urls import path, include
from predictions.views import ResolveEventView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("accounts.urls")),
    path("api/events/", include("events.urls")),
    path("api/events/<int:event_id>/resolve/", ResolveEventView.as_view(), name="resolve-event"),
    path("api/predictions/", include("predictions.urls")),
    path("api/payments/", include("payments.urls")),
]
