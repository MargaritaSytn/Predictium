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


class PurchaseTokensView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        serializer = PurchaseTokensSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            result = create_token_purchase(
                request.user, serializer.validated_data["token_amount"]
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
                serializer.validated_data["payment_id"],
                serializer.validated_data["payer_id"],
            )
            return Response({"detail": "Tokens purchased successfully."})
        except PaymentError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class PurchasePremiumView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        try:
            result = create_premium_purchase(request.user)
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
                serializer.validated_data["payment_id"],
                serializer.validated_data["payer_id"],
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
                request.user, serializer.validated_data["token_amount"]
            )
            return Response(result, status=status.HTTP_201_CREATED)
        except PaymentError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
