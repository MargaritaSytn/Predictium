from rest_framework import serializers
from core.models import Transaction


class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = (
            "id", "type", "amount", "currency_equivalent",
            "status", "created_at", "confirmed_at",
            "external_payment_id",
        )
        read_only_fields = fields


class PurchaseTokensSerializer(serializers.Serializer):
    token_amount = serializers.IntegerField(min_value=10)
    platform = serializers.ChoiceField(choices=["web", "android"], default="web")


class ExecutePaymentSerializer(serializers.Serializer):
    order_id = serializers.CharField()


class WithdrawSerializer(serializers.Serializer):
    token_amount = serializers.IntegerField(min_value=1)
    paypal_email = serializers.EmailField()
