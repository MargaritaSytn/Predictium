from rest_framework import serializers
from core.models import Prediction


class PlacePredictionSerializer(serializers.Serializer):
    event = serializers.IntegerField()
    selected_outcome = serializers.IntegerField()
    amount_tokens = serializers.IntegerField(min_value=1)


class PredictionSerializer(serializers.ModelSerializer):
    event_title = serializers.CharField(source="event.title", read_only=True)
    outcome_label = serializers.CharField(source="selected_outcome.label", read_only=True)

    class Meta:
        model = Prediction
        fields = (
            "id", "event", "event_title", "selected_outcome", "outcome_label",
            "amount_tokens", "locked_coefficient", "prediction_status",
            "payout_amount", "probability_at_creation", "created_at",
        )
        read_only_fields = fields


class ResolveEventSerializer(serializers.Serializer):
    winning_outcome = serializers.IntegerField()
