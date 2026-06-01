import logging
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from core.models import Event, Notification, Prediction, User
from notifications.push import send_push_notifications

logger = logging.getLogger(__name__)

# Detection window must be wider than the cron interval (15 min) so no event
# is ever missed. reminder_sent flag on Event prevents duplicate sends.
REMINDER_LEAD_TIME = timedelta(hours=24)
REMINDER_DETECTION_WINDOW = timedelta(hours=2)
CLOSING_DETECTION_WINDOW = timedelta(hours=2)


class Command(BaseCommand):
    help = "Send deadline reminders and close expired events with notifications."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Print what would happen without writing to the database.",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        now = timezone.now()
        reminded = self._send_deadline_reminders(now, dry_run)
        closed = self._close_and_notify(now, dry_run)
        self.stdout.write(
            self.style.SUCCESS(
                f"Done. Reminders sent: {reminded}. Events closed: {closed}."
            )
        )

    def _send_deadline_reminders(self, now, dry_run):
        window_start = now + REMINDER_LEAD_TIME - REMINDER_DETECTION_WINDOW
        window_end = now + REMINDER_LEAD_TIME
        events = Event.objects.filter(
            status="open",
            reminder_sent=False,
            deadline__gte=window_start,
            deadline__lt=window_end,
        )
        total = 0
        for event in events:
            participants = self._get_participants(event)
            title = f"Нагадування: {event.title}"
            message = (
                f"До завершення голосування залишилось 24 години. "
                f"Дедлайн: {event.deadline.strftime('%d.%m.%Y %H:%M')} UTC."
            )
            if not dry_run:
                if participants:
                    Notification.objects.bulk_create([
                        Notification(
                            user=u,
                            type="deadline_reminder",
                            title=title,
                            message=message,
                        )
                        for u in participants
                    ])
                    send_push_notifications([(u, title, message) for u in participants])
                Event.objects.filter(pk=event.pk).update(reminder_sent=True)
            total += len(participants)
            logger.info(
                "deadline_reminder: event %d (%s) — %d notifications %s.",
                event.id,
                event.title,
                len(participants),
                "would be sent (dry-run)" if dry_run else "sent",
            )
        return total

    def _close_and_notify(self, now, dry_run):
        window_start = now - CLOSING_DETECTION_WINDOW
        events = Event.objects.filter(
            status="open",
            deadline__gte=window_start,
            deadline__lt=now,
        )
        closed_count = 0
        for event in events:
            if dry_run:
                user_count = User.objects.filter(is_active=True).count()
                self.stdout.write(
                    f"[dry-run] Would close event {event.id} ({event.title}), "
                    f"notify {user_count} users."
                )
                closed_count += 1
                continue
            try:
                with transaction.atomic():
                    # Row lock prevents duplicate closes if two processes overlap.
                    locked = (
                        Event.objects.select_for_update()
                        .filter(pk=event.pk, status="open")
                        .first()
                    )
                    if locked is None:
                        continue
                    locked.status = "closed"
                    locked.save(update_fields=["status", "updated_at"])
                    all_users = list(User.objects.filter(is_active=True))
                    if all_users:
                        title = f"Голосування завершено: {locked.title}"
                        message = (
                            "Термін голосування минув. "
                            "Очікуйте на оголошення результатів."
                        )
                        Notification.objects.bulk_create([
                            Notification(
                                user=u,
                                type="voting_closed",
                                title=title,
                                message=message,
                            )
                            for u in all_users
                        ])
                        send_push_notifications(
                            [(u, title, message) for u in all_users]
                        )
                closed_count += 1
                logger.info(
                    "voting_closed: event %d (%s) closed, %d users notified.",
                    event.id,
                    event.title,
                    len(all_users),
                )
            except Exception:
                logger.exception("Failed to close event %d (%s).", event.id, event.title)
        return closed_count


    @staticmethod
    def _get_participants(event):
        preds = (
            Prediction.objects.filter(
                event=event,
                prediction_status__in=("active", "locked"),
            ).select_related("user")
        )
        seen, users = set(), []
        for p in preds:
            if p.user_id not in seen:
                seen.add(p.user_id)
                users.append(p.user)
        return users
