from google import genai
from google.genai import errors as genai_errors
from django.conf import settings
from django.utils import timezone

from core.models import AIHintUsage, Event


class AIHintError(Exception):
    def __init__(self, message, code=None):
        super().__init__(message)
        self.code = code


def _get_daily_limit(user) -> int:
    if user.premium_status:
        return settings.AI_HINT_PREMIUM_LIMIT
    return settings.AI_HINT_FREE_LIMIT


def _get_usage(user) -> AIHintUsage:
    today = timezone.now().date()
    usage, _ = AIHintUsage.objects.get_or_create(
        user=user, date=today, defaults={"hints_used": 0}
    )
    return usage


def _build_prompt(event) -> str:
    outcomes = event.outcomes.all()
    total_pool = sum(o.total_tokens_wagered for o in outcomes)
    outcomes_text = "\n".join(
        f"  - {o.label}: coefficient {o.current_coefficient:.2f}x "
        f"({o.total_tokens_wagered} tokens wagered)"
        for o in outcomes
    ) or "  (no outcomes defined yet)"

    deadline_str = (
        event.deadline.strftime("%Y-%m-%d %H:%M UTC")
        if hasattr(event.deadline, "strftime")
        else str(event.deadline)
    )

    return (
        "You are a prediction market analyst. Analyze this event and give a brief, "
        "practical hint to help a user decide which outcome to predict.\n\n"
        f"Event: {event.title}\n"
        f"Category: {event.category}\n"
        f"Description: {event.description}\n"
        f"Deadline: {deadline_str}\n"
        f"Total tokens in pool: {total_pool}\n\n"
        f"Outcomes and current market odds:\n{outcomes_text}\n\n"
        "Provide a concise analysis (3-5 sentences max) covering: "
        "which outcome the market currently favors (reference the actual "
        "coefficients and pool sizes above), "
        "any notable odds imbalances, "
        "and a brief risk/reward observation. "
        "Be concrete and specific — avoid generic filler. "
        "Do not make definitive predictions. "
        "Respond ONLY in the same language as the event description, "
        "using fluent, grammatically correct wording. "
        "Output only the analysis itself — no preamble, headings, or reasoning."
    )


def get_ai_hint(user, event_id: int) -> dict:
    usage = _get_usage(user)
    limit = _get_daily_limit(user)

    if usage.hints_used >= limit:
        raise AIHintError(
            f"Денний ліміт підказок вичерпано ({limit}/день). "
            "Оновіть до Premium для більшого доступу.",
            code="limit_reached",
        )

    try:
        event = Event.objects.prefetch_related("outcomes").get(id=event_id)
    except Event.DoesNotExist:
        raise AIHintError("Подія не знайдена.", code="event_not_found")

    prompt = _build_prompt(event)

    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    try:
        response = client.models.generate_content(
            model=settings.AI_HINT_MODEL,
            contents=prompt,
            # Budget is generous so reasoning models (gemini-2.5-pro/flash) have
            # room to "think" without starving the visible answer; the prompt
            # keeps the actual hint to 3-5 sentences.
            config={"max_output_tokens": 2048, "temperature": 0.4},
        )
        hint_text = (response.text or "").strip()
    except genai_errors.APIError as e:
        raise AIHintError(f"Помилка сервісу ШІ: {e}", code="api_error")

    if not hint_text:
        raise AIHintError("Сервіс ШІ повернув порожню відповідь.", code="api_error")

    usage.hints_used += 1
    usage.save(update_fields=["hints_used"])

    hints_remaining = max(0, limit - usage.hints_used)
    return {
        "hint_text": hint_text,
        "hints_used_today": usage.hints_used,
        "hints_remaining": hints_remaining,
    }


def get_hint_status(user) -> dict:
    usage = _get_usage(user)
    limit = _get_daily_limit(user)
    return {
        "hints_used_today": usage.hints_used,
        "hints_remaining": max(0, limit - usage.hints_used),
        "daily_limit": limit,
    }
