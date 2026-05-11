from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from core.throttles import LoginRateThrottle, RegisterRateThrottle
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken
from core.models import DAILY_BONUS, Transaction
from .serializers import (
    RegisterSerializer, LoginSerializer, UserProfileSerializer,
    TopPredictorSerializer,
)

User = get_user_model()


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
            bonus_granted = _grant_daily_bonus(user)
            user.refresh_from_db()
            request.session["login_count"] = request.session.get("login_count", 0) + 1
            refresh = RefreshToken.for_user(user)
            return Response({
                "user": UserProfileSerializer(user).data,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "daily_bonus_granted": bonus_granted,
            })
        return Response(
            {"detail": "Invalid credentials."},
            status=status.HTTP_401_UNAUTHORIZED,
        )


class ProfileView(generics.RetrieveAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = UserProfileSerializer

    def get_object(self):
        return self.request.user


class TopPredictorsView(generics.ListAPIView):
    permission_classes = (AllowAny,)
    serializer_class = TopPredictorSerializer

    def get_queryset(self):
        return (
            User.objects.select_related("profile")
            .filter(profile__total_predictions__gte=5)
            .order_by("-profile__success_rate")[:5]
        )
