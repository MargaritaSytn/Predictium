import logging
import urllib.request
import json

import requests

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db.models import Count, Sum, Avg
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from core.throttles import LoginRateThrottle, RegisterRateThrottle
from core.models import DAILY_BONUS, Transaction, Follow, Report, Event, Prediction, Wallet
from .serializers import (
    RegisterSerializer, LoginSerializer, UserProfileSerializer,
    TopPredictorSerializer, PublicUserSerializer,
    CreateReportSerializer, ReportSerializer,
    AdminUserSerializer,
)

logger = logging.getLogger(__name__)

User = get_user_model()


def _expire_premium_if_needed(user):
    if not user.premium_status:
        return
    sub = getattr(user, "premium_subscription", None)
    if sub and sub.end_date < timezone.now():
        user.premium_status = False
        user.save(update_fields=["premium_status"])
        sub.status = "expired"
        sub.save(update_fields=["status"])


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    throttle_classes = (RegisterRateThrottle,)
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            "user": UserProfileSerializer(user).data,
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }, status=status.HTTP_201_CREATED)


def _grant_daily_bonus(user):
    today = timezone.now().date()
    if user.last_login_date == today:
        return False

    yesterday = today - timezone.timedelta(days=1)
    if user.last_login_date == yesterday:
        user.consecutive_login_days += 1
    else:
        user.consecutive_login_days = 1

    user.last_login_date = today
    user.save(update_fields=["last_login_date", "consecutive_login_days"])

    wallet = user.wallet
    wallet.current_balance += DAILY_BONUS
    wallet.save()

    Transaction.objects.create(
        wallet=wallet,
        type="bonus",
        amount=DAILY_BONUS,
        status="confirmed",
        confirmed_at=timezone.now(),
    )
    return True


class LoginView(APIView):
    permission_classes = (AllowAny,)
    throttle_classes = (LoginRateThrottle,)

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        password = serializer.validated_data["password"]
        user = User.objects.filter(email=email).first()
        if user and user.check_password(password):
            _expire_premium_if_needed(user)
            request.session["login_count"] = request.session.get("login_count", 0) + 1
            refresh = RefreshToken.for_user(user)
            today = timezone.now().date()
            return Response({
                "user": UserProfileSerializer(user).data,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "daily_bonus_available": user.last_login_date != today,
            })
        return Response(
            {"detail": "Invalid credentials."},
            status=status.HTTP_401_UNAUTHORIZED,
        )


class ProfileView(generics.RetrieveAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = UserProfileSerializer

    def get_object(self):
        _expire_premium_if_needed(self.request.user)
        return self.request.user


class ClaimDailyBonusView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        bonus_granted = _grant_daily_bonus(request.user)
        request.user.refresh_from_db()
        return Response({
            "user": UserProfileSerializer(request.user).data,
            "daily_bonus_granted": bonus_granted,
        })


class TopPredictorsView(generics.ListAPIView):
    permission_classes = (AllowAny,)
    serializer_class = TopPredictorSerializer

    def get_queryset(self):
        return (
            User.objects.select_related("profile")
            .filter(profile__total_predictions__gte=5)
            .order_by("-profile__success_rate")[:5]
        )


class PublicProfileView(generics.RetrieveAPIView):
    permission_classes = (AllowAny,)
    serializer_class = PublicUserSerializer
    queryset = User.objects.select_related("profile")
    lookup_field = "pk"


class FollowUserView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request, pk):
        target = User.objects.filter(pk=pk).first()
        if not target:
            return Response({"detail": "Користувача не знайдено."}, status=status.HTTP_404_NOT_FOUND)
        if target == request.user:
            return Response({"detail": "Неможливо підписатися на себе."}, status=status.HTTP_400_BAD_REQUEST)
        _, created = Follow.objects.get_or_create(follower=request.user, following=target)
        if not created:
            return Response({"detail": "Ви вже підписані на цього користувача."}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"detail": "Підписано."}, status=status.HTTP_201_CREATED)

    def delete(self, request, pk):
        deleted, _ = Follow.objects.filter(follower=request.user, following_id=pk).delete()
        if not deleted:
            return Response({"detail": "Ви не підписані на цього користувача."}, status=status.HTTP_400_BAD_REQUEST)
        return Response(status=status.HTTP_204_NO_CONTENT)


class FollowersListView(generics.ListAPIView):
    permission_classes = (AllowAny,)
    serializer_class = PublicUserSerializer

    def get_queryset(self):
        return User.objects.filter(
            following__following_id=self.kwargs["pk"]
        ).select_related("profile")


class FollowingListView(generics.ListAPIView):
    permission_classes = (AllowAny,)
    serializer_class = PublicUserSerializer

    def get_queryset(self):
        return User.objects.filter(
            followers__follower_id=self.kwargs["pk"]
        ).select_related("profile")


class CreateReportView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        serializer = CreateReportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        report = serializer.save(reporter=request.user)
        return Response(ReportSerializer(report).data, status=status.HTTP_201_CREATED)


class ReportListView(generics.ListAPIView):
    permission_classes = (IsAdminUser,)
    serializer_class = ReportSerializer

    def get_queryset(self):
        return Report.objects.all().order_by("-created_at")


# ── Admin Analytics ───────────────────────────────────────────────────────────

class PlatformStatsView(APIView):
    """Admin: platform-wide statistics."""
    permission_classes = (IsAdminUser,)

    def get(self, request):
        total_users = User.objects.count()
        premium_users = User.objects.filter(premium_status=True).count()
        total_events = Event.objects.count()
        open_events = Event.objects.filter(status="open").count()
        completed_events = Event.objects.filter(status="completed").count()
        total_predictions = Prediction.objects.count()
        total_tokens_wagered = Prediction.objects.aggregate(
            total=Sum("amount_tokens")
        )["total"] or 0
        total_revenue_usd = Transaction.objects.filter(
            type="purchase", status="confirmed"
        ).aggregate(total=Sum("currency_equivalent"))["total"] or 0.0
        total_withdrawals_usd = Transaction.objects.filter(
            type="withdrawal", status="confirmed"
        ).aggregate(total=Sum("currency_equivalent"))["total"] or 0.0

        return Response({
            "users": {
                "total": total_users,
                "premium": premium_users,
            },
            "events": {
                "total": total_events,
                "open": open_events,
                "completed": completed_events,
            },
            "predictions": {
                "total": total_predictions,
                "total_tokens_wagered": total_tokens_wagered,
            },
            "revenue": {
                "total_purchases_usd": round(float(total_revenue_usd), 2),
                "total_withdrawals_usd": round(float(total_withdrawals_usd), 2),
                "net_usd": round(float(total_revenue_usd) - float(total_withdrawals_usd), 2),
            },
        })


class AdminUserListView(generics.ListAPIView):
    """Admin: paginated user list with key stats."""
    permission_classes = (IsAdminUser,)
    serializer_class = AdminUserSerializer

    def get_queryset(self):
        return User.objects.select_related("profile", "wallet").order_by("-date_joined")


class AdminUserDetailView(generics.RetrieveAPIView):
    """Admin: detailed analytics for a single user."""
    permission_classes = (IsAdminUser,)
    serializer_class = AdminUserSerializer
    queryset = User.objects.select_related("profile", "wallet")
    lookup_field = "pk"


# ── Social Auth (Google / Facebook) ──────────────────────────────────────────

def _social_auth_response(user):
    """Generate JWT tokens and profile for a social-authenticated user."""
    refresh = RefreshToken.for_user(user)
    today = timezone.now().date()
    return Response({
        "user": UserProfileSerializer(user).data,
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "daily_bonus_available": user.last_login_date != today,
    })


class GoogleAuthView(APIView):
    """Verify Google access_token via userinfo endpoint and return JWT credentials."""
    permission_classes = (AllowAny,)

    def post(self, request):
        access_token = request.data.get("access_token", "").strip()
        if not access_token:
            return Response(
                {"detail": "access_token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            resp = requests.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {access_token}"},
                timeout=10,
            )
            resp.raise_for_status()
            userinfo = resp.json()
        except (requests.RequestException, ValueError) as exc:
            logger.warning("Google userinfo failed: %s", exc)
            return Response(
                {"detail": "Invalid Google token."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        email = userinfo.get("email")
        if not email:
            return Response(
                {"detail": "Google account has no email."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.filter(email=email).first()
        if not user:
            username = userinfo.get("name", email.split("@")[0])
            base_username = username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1
            user = User.objects.create_user(
                username=username,
                email=email,
                password=None,
            )

        return _social_auth_response(user)


class FacebookAuthView(APIView):
    """Verify Facebook access token and return JWT credentials."""
    permission_classes = (AllowAny,)

    def post(self, request):
        access_token = request.data.get("access_token", "").strip()
        if not access_token:
            return Response(
                {"detail": "access_token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            url = f"https://graph.facebook.com/me?fields=id,name,email&access_token={access_token}"
            req = urllib.request.Request(url, method="GET")
            with urllib.request.urlopen(req, timeout=10) as resp:
                fb_data = json.loads(resp.read().decode("utf-8"))
        except Exception as exc:
            logger.warning("Facebook token verification failed: %s", exc)
            return Response(
                {"detail": "Invalid Facebook token."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        email = fb_data.get("email")
        if not email:
            return Response(
                {"detail": "Facebook account has no email. Please grant email permission."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.filter(email=email).first()
        if not user:
            username = fb_data.get("name", email.split("@")[0])
            base_username = username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1
            user = User.objects.create_user(
                username=username,
                email=email,
                password=None,
            )

        return _social_auth_response(user)

