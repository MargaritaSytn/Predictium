"""Unified push notification dispatch for Expo and FCM tokens."""

import json
import logging
import urllib.request

from django.conf import settings
from core.models import DeviceToken

logger = logging.getLogger(__name__)

_firebase_app = None


def _get_firebase_app():
    global _firebase_app
    if _firebase_app is not None:
        return _firebase_app

    credentials_path = getattr(settings, "FIREBASE_CREDENTIALS_PATH", None)
    if not credentials_path:
        return None

    try:
        import firebase_admin
        from firebase_admin import credentials as fb_credentials

        cred = fb_credentials.Certificate(credentials_path)
        _firebase_app = firebase_admin.initialize_app(cred)
        return _firebase_app
    except Exception as exc:
        logger.warning("Failed to initialize Firebase Admin: %s", exc)
        return None


def _send_expo_push(tokens: list[str], title: str, body: str) -> None:
    if not tokens:
        return
    messages = [{"to": t, "title": title, "body": body, "sound": "default"} for t in tokens]
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


def _send_fcm_push(tokens: list[str], title: str, body: str) -> None:
    if not tokens:
        return

    app = _get_firebase_app()
    if app is None:
        logger.warning("Firebase not configured — skipping FCM push for %d tokens", len(tokens))
        return

    try:
        from firebase_admin import messaging

        for token in tokens:
            message = messaging.Message(
                notification=messaging.Notification(title=title, body=body),
                token=token,
            )
            try:
                messaging.send(message)
            except Exception as exc:
                logger.warning("FCM send failed for token %s: %s", token[:20], exc)
    except Exception as exc:
        logger.warning("FCM push error: %s", exc)


def send_push_notifications(user_notification_pairs: list[tuple]) -> None:
    """Send push notifications to users via their registered devices.

    Accepts a list of (user, title, body) tuples. Dispatches to the correct
    push provider (Expo or FCM) based on each device token's token_type.
    """
    if not user_notification_pairs:
        return

    user_ids = [user.id for user, _, _ in user_notification_pairs]
    tokens_by_user: dict[int, dict[str, list[str]]] = {}
    for dt in DeviceToken.objects.filter(user_id__in=user_ids):
        tokens_by_user.setdefault(dt.user_id, {"expo": [], "fcm": []})
        tokens_by_user[dt.user_id][dt.token_type].append(dt.token)

    all_expo = []
    all_fcm = []

    for user, title, body in user_notification_pairs:
        user_tokens = tokens_by_user.get(user.id, {"expo": [], "fcm": []})
        for token in user_tokens["expo"]:
            all_expo.append((token, title, body))
        for token in user_tokens["fcm"]:
            all_fcm.append((token, title, body))

    # Batch Expo push (supports multiple messages in one call)
    if all_expo:
        _send_expo_push(
            [t for t, _, _ in all_expo],
            all_expo[0][1],
            all_expo[0][2],
        )

    # FCM: send individually per token (Firebase Admin SDK sends one at a time)
    for token, title, body in all_fcm:
        _send_fcm_push([token], title, body)
