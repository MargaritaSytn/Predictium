from django.urls import path
from .views import PlacePredictionView, UserPredictionsView

urlpatterns = [
    path("", PlacePredictionView.as_view(), name="place-prediction"),
    path("my/", UserPredictionsView.as_view(), name="user-predictions"),
]
