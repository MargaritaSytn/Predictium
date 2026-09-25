from django.urls import path

from .views import AIHintView, HintStatusView

urlpatterns = [
    path("status/", HintStatusView.as_view(), name="hint-status"),
    path("<int:event_id>/", AIHintView.as_view(), name="get-ai-hint"),
]
