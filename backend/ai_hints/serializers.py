from rest_framework import serializers


class HintResponseSerializer(serializers.Serializer):
    hint_text = serializers.CharField()
    hints_used_today = serializers.IntegerField()
    hints_remaining = serializers.IntegerField()


class HintStatusSerializer(serializers.Serializer):
    hints_used_today = serializers.IntegerField()
    hints_remaining = serializers.IntegerField()
    daily_limit = serializers.IntegerField()
