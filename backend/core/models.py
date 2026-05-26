from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver


class User(AbstractUser):
    email = models.EmailField(unique=True)
    token_balance = models.IntegerField(default=0)
    premium_status = models.BooleanField(default=False)
    registration_date = models.DateField(auto_now_add=True)
    consecutive_login_days = models.IntegerField(default=0)
    last_login_date = models.DateField(null=True, blank=True)

    class Meta:
        db_table = "users"

    def __str__(self):
        return self.username


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    bio = models.TextField(blank=True, default="")
    success_rate = models.FloatField(default=0.0)
    won_predictions = models.IntegerField(default=0)
    total_predictions = models.IntegerField(default=0)

    class Meta:
        db_table = "profiles"

    def __str__(self):
        return f"Profile({self.user.username})"


class Wallet(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="wallet")
    current_balance = models.IntegerField(default=0)
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "wallets"

    def __str__(self):
        return f"Wallet({self.user.username}: {self.current_balance})"


class Event(models.Model):
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("open", "Open"),
        ("closed", "Closed"),
        ("resolving", "Resolving"),
        ("completed", "Completed"),
    ]

    CATEGORY_CHOICES = [
        ("sports", "Спорт"),
        ("politics", "Політика"),
        ("technology", "Технології"),
        ("crypto", "Криптовалюта"),
        ("space", "Космос"),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(max_length=100, choices=CATEGORY_CHOICES)
    image_url = models.URLField(blank=True, default="")
    deadline = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    result = models.CharField(max_length=255, blank=True, default="")

    class Meta:
        db_table = "events"
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["deadline"]),
            models.Index(fields=["category"]),
        ]

    def __str__(self):
        return self.title


class EventOutcome(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="outcomes")
    label = models.CharField(max_length=255)
    total_tokens_wagered = models.IntegerField(default=0)

    class Meta:
        db_table = "event_outcomes"

    @property
    def current_coefficient(self):
        total_pool = sum(
            o.total_tokens_wagered for o in self.event.outcomes.all()
        )
        if self.total_tokens_wagered == 0 or total_pool == 0:
            return 0.0
        return round(total_pool / self.total_tokens_wagered, 2)

    def __str__(self):
        return f"{self.event.title}: {self.label}"


class Prediction(models.Model):
    STATUS_CHOICES = [
        ("active", "Active"),
        ("locked", "Locked"),
        ("won", "Won"),
        ("lost", "Lost"),
        ("cancelled", "Cancelled"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="predictions")
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="predictions")
    selected_outcome = models.ForeignKey(EventOutcome, on_delete=models.CASCADE, related_name="predictions")
    amount_tokens = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    probability_at_creation = models.FloatField(default=0.0)
    prediction_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")
    payout_amount = models.FloatField(default=0.0)
    locked_coefficient = models.FloatField(default=0.0)

    class Meta:
        db_table = "predictions"
        indexes = [
            models.Index(fields=["user"]),
            models.Index(fields=["event"]),
            models.Index(fields=["prediction_status"]),
        ]

    def __str__(self):
        return f"{self.user.username} on {self.event.title}"


class Review(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="reviews")
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="reviews")
    rating = models.IntegerField()
    comment_text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_approved = models.BooleanField(default=False)

    class Meta:
        db_table = "reviews"

    def __str__(self):
        return f"Review by {self.user.username} on {self.event.title}"


class PremiumSubscription(models.Model):
    STATUS_CHOICES = [
        ("active", "Active"),
        ("expired", "Expired"),
        ("cancelled", "Cancelled"),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="premium_subscription")
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")
    auto_renew = models.BooleanField(default=False)

    class Meta:
        db_table = "premium_subscriptions"


class Transaction(models.Model):
    TYPE_CHOICES = [
        ("wager", "Wager"),
        ("winning", "Winning"),
        ("purchase", "Purchase"),
        ("withdrawal", "Withdrawal"),
        ("bonus", "Bonus"),
        ("premium", "Premium Purchase"),
    ]
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("confirmed", "Confirmed"),
        ("rejected", "Rejected"),
        ("cancelled", "Cancelled"),
    ]

    wallet = models.ForeignKey(Wallet, on_delete=models.CASCADE, related_name="transactions")
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    amount = models.FloatField()
    currency_equivalent = models.FloatField(default=0.0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    external_payment_id = models.CharField(max_length=255, blank=True, default="")

    class Meta:
        db_table = "transactions"
        indexes = [
            models.Index(fields=["wallet"]),
            models.Index(fields=["type"]),
            models.Index(fields=["status"]),
        ]


class Notification(models.Model):
    TYPE_CHOICES = [
        ("deadline_reminder", "Deadline Reminder"),
        ("new_event", "New Event"),
        ("voting_closed", "Voting Closed"),
        ("result_announced", "Result Announced"),
        ("system", "System"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications")
    type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    send_time = models.DateTimeField(auto_now_add=True)
    delivery_status = models.CharField(max_length=20, default="pending")
    is_read = models.BooleanField(default=False)

    class Meta:
        db_table = "notifications"
        indexes = [
            models.Index(fields=["user"]),
            models.Index(fields=["user", "is_read"]),
        ]


class AIHintUsage(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="ai_hint_usage")
    date = models.DateField()
    hints_used = models.IntegerField(default=0)

    class Meta:
        db_table = "ai_hint_usage"
        unique_together = ["user", "date"]


class Follow(models.Model):
    follower = models.ForeignKey(User, on_delete=models.CASCADE, related_name="following")
    following = models.ForeignKey(User, on_delete=models.CASCADE, related_name="followers")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "follows"
        unique_together = ["follower", "following"]

    def __str__(self):
        return f"{self.follower.username} -> {self.following.username}"


class Report(models.Model):
    REASON_CHOICES = [
        ("spam", "Spam"),
        ("offensive", "Offensive Content"),
        ("misinformation", "Misinformation"),
        ("harassment", "Harassment"),
        ("other", "Other"),
    ]
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("reviewed", "Reviewed"),
        ("dismissed", "Dismissed"),
    ]

    reporter = models.ForeignKey(User, on_delete=models.CASCADE, related_name="reports_filed")
    reported_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="reports_received", null=True, blank=True)
    reported_review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name="reports", null=True, blank=True)
    reason = models.CharField(max_length=20, choices=REASON_CHOICES)
    description = models.TextField(blank=True, default="")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "reports"

    def __str__(self):
        target = self.reported_user or self.reported_review
        return f"Report by {self.reporter.username} on {target}"


class DeviceToken(models.Model):
    """Stores push tokens (Expo or FCM) for mobile push notification delivery."""

    TOKEN_TYPE_CHOICES = [("expo", "Expo Push Token"), ("fcm", "FCM Token")]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="device_tokens")
    token = models.CharField(max_length=200, unique=True)
    token_type = models.CharField(max_length=10, choices=TOKEN_TYPE_CHOICES, default="expo")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "device_tokens"

    def __str__(self):
        return f"DeviceToken({self.user.username}, {self.token_type})"


STARTING_BALANCE = 100
DAILY_BONUS = 10


@receiver(post_save, sender=User)
def create_user_profile_and_wallet(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)
        Wallet.objects.create(user=instance, current_balance=STARTING_BALANCE)
