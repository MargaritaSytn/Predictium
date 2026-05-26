from rest_framework import serializers
from django.contrib.auth import get_user_model
from core.models import Report

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ("username", "email", "password", "password_confirm")

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop("password_confirm")
        user = User.objects.create_user(**validated_data)
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()


class TopPredictorSerializer(serializers.ModelSerializer):
    success_rate = serializers.FloatField(source="profile.success_rate", read_only=True)

    class Meta:
        model = User
        fields = ("id", "username", "success_rate")
        read_only_fields = fields


class UserProfileSerializer(serializers.ModelSerializer):
    bio = serializers.CharField(source="profile.bio", read_only=True)
    wallet_balance = serializers.IntegerField(source="wallet.current_balance", read_only=True)
    total_predictions = serializers.SerializerMethodField()
    won_predictions = serializers.SerializerMethodField()
    success_rate = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id", "username", "email", "token_balance", "premium_status", "is_staff",
            "registration_date", "bio", "success_rate", "won_predictions",
            "total_predictions", "wallet_balance",
        )
        read_only_fields = fields

    def get_total_predictions(self, obj):
        return obj.predictions.count()

    def get_won_predictions(self, obj):
        return obj.predictions.filter(prediction_status="won").count()

    def get_success_rate(self, obj):
        completed = obj.predictions.filter(prediction_status__in=["won", "lost"]).count()
        if completed == 0:
            return 0.0
        won = obj.predictions.filter(prediction_status="won").count()
        return round((won / completed) * 100, 1)


class PublicUserSerializer(serializers.ModelSerializer):
    bio = serializers.CharField(source="profile.bio", read_only=True)
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    is_following = serializers.SerializerMethodField()
    total_predictions = serializers.SerializerMethodField()
    won_predictions = serializers.SerializerMethodField()
    success_rate = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id", "username", "registration_date", "premium_status",
            "bio", "success_rate", "total_predictions", "won_predictions",
            "followers_count", "following_count", "is_following",
        )
        read_only_fields = fields

    def get_followers_count(self, obj):
        return obj.followers.count()

    def get_following_count(self, obj):
        return obj.following.count()

    def get_is_following(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.followers.filter(follower=request.user).exists()
        return False

    def get_total_predictions(self, obj):
        return obj.predictions.count()

    def get_won_predictions(self, obj):
        return obj.predictions.filter(prediction_status="won").count()

    def get_success_rate(self, obj):
        completed = obj.predictions.filter(prediction_status__in=["won", "lost"]).count()
        if completed == 0:
            return 0.0
        won = obj.predictions.filter(prediction_status="won").count()
        return round((won / completed) * 100, 1)


class CreateReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = ("reported_user", "reported_review", "reason", "description")

    def validate(self, attrs):
        if not attrs.get("reported_user") and not attrs.get("reported_review"):
            raise serializers.ValidationError("Вкажіть користувача або відгук для скарги.")
        return attrs


class ReportSerializer(serializers.ModelSerializer):
    reporter_username = serializers.CharField(source="reporter.username", read_only=True)
    reported_username = serializers.CharField(source="reported_user.username", read_only=True, default=None)

    class Meta:
        model = Report
        fields = (
            "id", "reporter_username", "reported_user", "reported_username",
            "reported_review", "reason", "description", "status", "created_at",
        )
        read_only_fields = ("id", "reporter_username", "reported_username", "status", "created_at")


class AdminUserSerializer(serializers.ModelSerializer):
    success_rate = serializers.FloatField(source="profile.success_rate", read_only=True)
    total_predictions = serializers.IntegerField(source="profile.total_predictions", read_only=True)
    won_predictions = serializers.IntegerField(source="profile.won_predictions", read_only=True)
    wallet_balance = serializers.IntegerField(source="wallet.current_balance", read_only=True)

    class Meta:
        model = User
        fields = (
            "id", "username", "email", "is_active", "is_staff",
            "premium_status", "registration_date", "last_login_date",
            "consecutive_login_days", "wallet_balance",
            "success_rate", "total_predictions", "won_predictions",
        )
        read_only_fields = fields

