import bleach
from rest_framework import serializers
from core.models import Event, EventOutcome, Review

_ALLOWED_TAGS: list = []  # strip all HTML tags from user text
_ALLOWED_ATTRS: dict = {}


class EventOutcomeSerializer(serializers.ModelSerializer):
    current_coefficient = serializers.FloatField(read_only=True)

    class Meta:
        model = EventOutcome
        fields = ("id", "label", "total_tokens_wagered", "current_coefficient")


class AddOutcomeSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventOutcome
        fields = ("label",)


class CreateEventSerializer(serializers.ModelSerializer):
    outcomes = serializers.ListField(
        child=serializers.CharField(max_length=255),
        min_length=2,
        write_only=True,
    )

    class Meta:
        model = Event
        fields = ("title", "description", "category", "image_url", "deadline", "status", "outcomes")

    def create(self, validated_data):
        outcome_labels = validated_data.pop("outcomes")
        event = Event.objects.create(**validated_data)
        for label in outcome_labels:
            EventOutcome.objects.create(event=event, label=label)
        return event


class UpdateEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = ("title", "description", "category", "image_url", "deadline", "status")
        extra_kwargs = {field: {"required": False} for field in fields}


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


class ReviewSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = Review
        fields = ("id", "username", "rating", "comment_text", "created_at", "is_approved")
        read_only_fields = ("id", "username", "created_at", "is_approved")


class CreateReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ("rating", "comment_text")

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Рейтинг повинен бути від 1 до 5.")
        return value

    def validate_comment_text(self, value):
        return bleach.clean(value, tags=_ALLOWED_TAGS, attributes=_ALLOWED_ATTRS, strip=True)


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
