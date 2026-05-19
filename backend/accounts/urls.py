from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, LoginView, ProfileView, TopPredictorsView,
    PublicProfileView, FollowUserView, FollowersListView, FollowingListView,
    CreateReportView, ReportListView,
    PlatformStatsView, AdminUserListView, AdminUserDetailView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("profile/", ProfileView.as_view(), name="profile"),
    path("top-predictors/", TopPredictorsView.as_view(), name="top-predictors"),
    path("users/<int:pk>/", PublicProfileView.as_view(), name="public-profile"),
    path("users/<int:pk>/follow/", FollowUserView.as_view(), name="follow-user"),
    path("users/<int:pk>/followers/", FollowersListView.as_view(), name="user-followers"),
    path("users/<int:pk>/following/", FollowingListView.as_view(), name="user-following"),
    path("reports/", CreateReportView.as_view(), name="create-report"),
    path("moderation/reports/", ReportListView.as_view(), name="report-list"),
    path("admin/stats/", PlatformStatsView.as_view(), name="platform-stats"),
    path("admin/users/", AdminUserListView.as_view(), name="admin-user-list"),
    path("admin/users/<int:pk>/", AdminUserDetailView.as_view(), name="admin-user-detail"),
]
