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


class ExecutePaymentSerializer(serializers.Serializer):
    payment_id = serializers.CharField()
    payer_id = serializers.CharField()


class WithdrawSerializer(serializers.Serializer):
    token_amount = serializers.IntegerField(min_value=1)
