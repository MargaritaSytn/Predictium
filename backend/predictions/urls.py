from django.urls import path
from .views import PlacePredictionView, UserPredictionsView, FriendsFeedView

urlpatterns = [
    path("", PlacePredictionView.as_view(), name="place-prediction"),
    path("my/", UserPredictionsView.as_view(), name="user-predictions"),
    path("feed/", FriendsFeedView.as_view(), name="friends-feed"),
]
