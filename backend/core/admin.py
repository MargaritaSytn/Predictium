from django.contrib import admin
from .models import (
    User, Profile, Wallet, Event, EventOutcome, Prediction,
    Review, PremiumSubscription, Transaction, Notification, AIHintUsage,
)


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("username", "email", "token_balance", "premium_status", "is_active")
    list_filter = ("premium_status", "is_active")
    search_fields = ("username", "email")


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "status", "deadline", "created_at")
    list_filter = ("status", "category")
    search_fields = ("title",)


@admin.register(EventOutcome)
class EventOutcomeAdmin(admin.ModelAdmin):
    list_display = ("event", "label", "total_tokens_wagered")


@admin.register(Prediction)
class PredictionAdmin(admin.ModelAdmin):
    list_display = ("user", "event", "amount_tokens", "prediction_status", "locked_coefficient")
    list_filter = ("prediction_status",)


admin.site.register(Profile)
admin.site.register(Wallet)
admin.site.register(Review)
admin.site.register(PremiumSubscription)
admin.site.register(Transaction)
admin.site.register(Notification)
admin.site.register(AIHintUsage)
