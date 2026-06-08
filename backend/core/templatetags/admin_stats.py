from django import template
from django.db.models import Count, Sum
from django.utils import timezone
from datetime import timedelta

from core.models import User, Event, Prediction, Transaction

register = template.Library()


@register.simple_tag
def get_platform_stats():
    today = timezone.now().date()
    month_ago = today - timedelta(days=30)
    week_ago = today - timedelta(days=7)

    total_users = User.objects.count()
    premium_users = User.objects.filter(premium_status=True).count()
    new_users_month = User.objects.filter(registration_date__gte=month_ago).count()
    active_users_month = User.objects.filter(last_login_date__gte=month_ago).count()
    active_users_week = User.objects.filter(last_login_date__gte=week_ago).count()

    total_events = Event.objects.count()
    open_events = Event.objects.filter(status="open").count()
    completed_events = Event.objects.filter(status="completed").count()
    draft_events = Event.objects.filter(status="draft").count()

    total_predictions = Prediction.objects.count()
    predictions_month = Prediction.objects.filter(created_at__date__gte=month_ago).count()
    total_tokens = Prediction.objects.aggregate(t=Sum("amount_tokens"))["t"] or 0

    pred_by_status = {
        row["prediction_status"]: row["count"]
        for row in Prediction.objects.values("prediction_status").annotate(count=Count("id"))
    }

    pred_by_category = list(
        Prediction.objects.values("event__category")
        .annotate(count=Count("id"))
        .order_by("-count")
    )

    total_revenue = Transaction.objects.filter(
        type="purchase", status="confirmed"
    ).aggregate(t=Sum("currency_equivalent"))["t"] or 0

    total_withdrawals = Transaction.objects.filter(
        type="withdrawal", status="confirmed"
    ).aggregate(t=Sum("currency_equivalent"))["t"] or 0

    premium_pct = round((premium_users / total_users * 100), 1) if total_users else 0
    premium_bar_w = int(premium_pct)

    CATEGORY_LABELS = {
        "sports": "Спорт",
        "politics": "Політика",
        "technology": "Технології",
        "crypto": "Крипто",
        "space": "Космос",
    }

    categories = [
        {
            "key": r["event__category"],
            "label": CATEGORY_LABELS.get(r["event__category"], r["event__category"] or "—"),
            "count": r["count"],
        }
        for r in pred_by_category if r["event__category"]
    ]

    max_cat = max((c["count"] for c in categories), default=1)

    return {
        "total_users": total_users,
        "premium_users": premium_users,
        "premium_pct": premium_pct,
        "premium_bar_w": premium_bar_w,
        "new_users_month": new_users_month,
        "active_users_month": active_users_month,
        "active_users_week": active_users_week,
        "total_events": total_events,
        "open_events": open_events,
        "completed_events": completed_events,
        "draft_events": draft_events,
        "total_predictions": total_predictions,
        "predictions_month": predictions_month,
        "total_tokens": total_tokens,
        "pred_active": pred_by_status.get("active", 0),
        "pred_won": pred_by_status.get("won", 0),
        "pred_lost": pred_by_status.get("lost", 0),
        "pred_locked": pred_by_status.get("locked", 0),
        "pred_cancelled": pred_by_status.get("cancelled", 0),
        "categories": categories,
        "max_cat": max_cat,
        "total_revenue": round(float(total_revenue), 2),
        "total_withdrawals": round(float(total_withdrawals), 2),
        "net_revenue": round(float(total_revenue) - float(total_withdrawals), 2),
    }
