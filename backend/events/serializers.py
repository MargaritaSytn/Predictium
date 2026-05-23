from rest_framework import serializers
from core.models import Event, EventOutcome


class EventOutcomeSerializer(serializers.ModelSerializer):
    current_coefficient = serializers.FloatField(read_only=True)

    class Meta:
        model = EventOutcome
        fields = ("id", "label", "total_tokens_wagered", "current_coefficient")


class EventListSerializer(serializers.ModelSerializer):
    outcomes = EventOutcomeSerializer(many=True, read_only=True)
    prediction_count = serializers.IntegerField(read_only=True, default=0)
    review_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Event
        fields = (
            "id", "title", "description", "category", "image_url", "deadline",
            "status", "created_at", "prediction_count", "review_count", "outcomes",
        )


class EventDetailSerializer(serializers.ModelSerializer):
    outcomes = EventOutcomeSerializer(many=True, read_only=True)
    prediction_count = serializers.IntegerField(read_only=True, default=0)
    review_count = serializers.IntegerField(read_only=True, default=0)
    total_tokens_wagered = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Event
        fields = (
            "id", "title", "description", "category", "image_url", "deadline",
            "status", "created_at", "updated_at", "result",
            "outcomes", "prediction_count", "review_count", "total_tokens_wagered",
        )
