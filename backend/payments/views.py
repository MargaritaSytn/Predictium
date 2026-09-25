from urllib.parse import urlencode

from django.http import HttpResponseRedirect
from django.views import View
from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from core.models import Transaction
from core.throttles import WithdrawRateThrottle
from .serializers import (
    PurchaseTokensSerializer, ExecutePaymentSerializer,
    WithdrawSerializer, TransactionSerializer,
)
from .services import (
    create_token_purchase, execute_token_purchase,
    create_premium_purchase, execute_premium_purchase,
    initiate_withdrawal, PaymentError,
)


class PayPalReturnView(View):
    """Redirect PayPal return URL back into the Android app via deep link."""

    def get(self, request):
        order_id = request.GET.get("token", "")
        pay_type = request.GET.get("type", "purchase")
        tokens = request.GET.get("tokens", "")
        params = {"order_id": order_id, "type": pay_type}
        if tokens:
            params["tokens"] = tokens
        deep_link = f"predictium://payment/success?{urlencode(params)}"
        return HttpResponseRedirect(deep_link)


class PayPalCancelView(View):
    """Redirect PayPal cancel URL back into the Android app via deep link."""

    def get(self, request):
        return HttpResponseRedirect("predictium://payment/cancel")


class PurchaseTokensView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        serializer = PurchaseTokensSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            result = create_token_purchase(
                request.user,
                serializer.validated_data["token_amount"],
                platform=serializer.validated_data.get("platform", "web"),
            )
            return Response(result, status=status.HTTP_201_CREATED)
        except PaymentError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ExecuteTokenPurchaseView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        serializer = ExecutePaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            execute_token_purchase(
                request.user,
                serializer.validated_data["order_id"],
            )
            return Response({"detail": "Tokens purchased successfully."})
        except PaymentError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class PurchasePremiumView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        try:
            platform = request.data.get("platform", "web")
            result = create_premium_purchase(request.user, platform=platform)
            return Response(result, status=status.HTTP_201_CREATED)
        except PaymentError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ExecutePremiumPurchaseView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        serializer = ExecutePaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            execute_premium_purchase(
                request.user,
                serializer.validated_data["order_id"],
            )
            return Response({"detail": "Premium activated!"})
        except PaymentError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class TransactionListView(generics.ListAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = TransactionSerializer

    def get_queryset(self):
        qs = Transaction.objects.filter(
            wallet__user=self.request.user
        ).order_by("-created_at")
        tx_type = self.request.query_params.get("type")
        if tx_type:
            qs = qs.filter(type=tx_type)
        return qs


class WithdrawView(APIView):
    permission_classes = (IsAuthenticated,)
    throttle_classes = (WithdrawRateThrottle,)

    def post(self, request):
        serializer = WithdrawSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            result = initiate_withdrawal(
                request.user,
                serializer.validated_data["token_amount"],
                serializer.validated_data["paypal_email"],
            )
            return Response(result, status=status.HTTP_201_CREATED)
        except PaymentError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
