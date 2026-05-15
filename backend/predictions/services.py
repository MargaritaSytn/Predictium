from django.db import transaction
from django.utils import timezone
import logging
import urllib.request
import json

from core.models import DeviceToken, Event, EventOutcome, Notification, Prediction, Transaction

logger = logging.getLogger(__name__)


def _send_expo_push_notifications(user_notification_pairs: list[tuple]) -> None:
    """Send Expo push notifications to mobile devices.

    Accepts a list of (user, title, body) tuples. Groups device tokens and
    calls the Expo Push API. Failures are logged but do not raise exceptions.
    """
    if not user_notification_pairs:
        return

    user_ids = [user.id for user, _, _ in user_notification_pairs]
    tokens_by_user: dict = {}
    for dt in DeviceToken.objects.filter(user_id__in=user_ids).select_related("user"):
        tokens_by_user.setdefault(dt.user_id, []).append(dt.token)

    messages = []
    for user, title, body in user_notification_pairs:
        for token in tokens_by_user.get(user.id, []):
            messages.append({"to": token, "title": title, "body": body, "sound": "default"})

    if not messages:
        return

    try:
        payload = json.dumps(messages).encode("utf-8")
        req = urllib.request.Request(
            "https://exp.host/--/api/v2/push/send",
            data=payload,
            headers={"Content-Type": "application/json", "Accept": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            if resp.status >= 400:
                logger.warning("Expo push API returned status %s", resp.status)
    except Exception as exc:
        logger.warning("Failed to send Expo push notifications: %s", exc)


class PredictionError(Exception):
    def __init__(self, message, code=None):
        super().__init__(message)
        self.code = code


def place_prediction(user, event_id, outcome_id, amount_tokens):
    with transaction.atomic():
        event = Event.objects.select_for_update().get(id=event_id)
        if event.status != "open":
            raise PredictionError("Event is not open for predictions.")

        if event.deadline <= timezone.now():
            raise PredictionError("Event deadline has passed.")

        outcome = EventOutcome.objects.select_for_update().get(
            id=outcome_id, event=event
        )

        wallet = user.wallet
        if wallet.current_balance < amount_tokens:
            raise PredictionError("Insufficient balance.")

        active_count = Prediction.objects.filter(
            user=user, prediction_status="active"
        ).count()
        if active_count >= 100:
            raise PredictionError("Maximum of 100 active predictions reached.")

        coefficient = outcome.current_coefficient
        if coefficient <= 0:
            total_pool = sum(
                o.total_tokens_wagered for o in event.outcomes.all()
            ) + amount_tokens
            coefficient = round(total_pool / amount_tokens, 2)

        wallet.current_balance -= amount_tokens
        wallet.save()

        outcome.total_tokens_wagered += amount_tokens
        outcome.save()

        prediction = Prediction.objects.create(
            user=user,
            event=event,
            selected_outcome=outcome,
            amount_tokens=amount_tokens,
            locked_coefficient=coefficient,
            probability_at_creation=1.0 / coefficient if coefficient > 0 else 0,
            prediction_status="active",
        )

        Transaction.objects.create(
            wallet=wallet,
            type="wager",
            amount=-amount_tokens,
            status="confirmed",
            confirmed_at=timezone.now(),
        )

        return prediction


def resolve_event(event_id, winning_outcome_id):
    with transaction.atomic():
        event = Event.objects.select_for_update().get(id=event_id)
        if event.status not in ("closed", "open"):
            raise PredictionError("Event cannot be resolved in current state.")

        winning_outcome = EventOutcome.objects.get(
            id=winning_outcome_id, event=event
        )

        event.status = "completed"
        event.result = winning_outcome.label
        event.save()

        predictions = Prediction.objects.filter(
            event=event, prediction_status__in=("active", "locked")
        ).select_for_update()

        for pred in predictions:
            if pred.selected_outcome_id == winning_outcome.id:
                payout = int(pred.amount_tokens * pred.locked_coefficient)
                pred.prediction_status = "won"
                pred.payout_amount = payout
                pred.save()

                wallet = pred.user.wallet
                wallet.current_balance += payout
                wallet.save()

                Transaction.objects.create(
                    wallet=wallet,
                    type="winning",
                    amount=payout,
                    status="confirmed",
                    confirmed_at=timezone.now(),
                )
            else:
                pred.prediction_status = "lost"
                pred.payout_amount = 0
                pred.save()

        # Trigger result_announced notifications
        notifications = []
        for pred in predictions:
            if pred.prediction_status == "won":
                title = f"Результат: {event.title}"
                message = f"Ваш прогноз виграв! Виплата: {pred.payout_amount} токенів."
            else:
                title = f"Результат: {event.title}"
                message = "Ваш прогноз не виграв. Дякуємо за участь!"
            notifications.append(
                Notification(
                    user=pred.user,
                    type="result_announced",
                    title=title,
                    message=message,
                )
            )
        if notifications:
            Notification.objects.bulk_create(notifications)

        # Send Expo push notifications to mobile devices
        push_pairs = [
            (
                pred.user,
                f"Результат: {event.title}",
                "Ваш прогноз виграв! Виплата: {} токенів.".format(pred.payout_amount)
                if pred.prediction_status == "won"
                else "Ваш прогноз не виграв. Дякуємо за участь!",
            )
            for pred in predictions
        ]
        _send_expo_push_notifications(push_pairs)
