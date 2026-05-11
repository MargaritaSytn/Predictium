from rest_framework import serializers
from django.contrib.auth import get_user_model

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
    success_rate = serializers.FloatField(source="profile.success_rate", read_only=True)
    won_predictions = serializers.IntegerField(source="profile.won_predictions", read_only=True)
    total_predictions = serializers.IntegerField(source="profile.total_predictions", read_only=True)
    wallet_balance = serializers.IntegerField(source="wallet.current_balance", read_only=True)

    class Meta:
        model = User
        fields = (
            "id", "username", "email", "token_balance", "premium_status", "is_staff",
            "registration_date", "bio", "success_rate", "won_predictions",
            "total_predictions", "wallet_balance",
        )
        read_only_fields = fields
