import time
from django.conf import settings
from django.db import transaction
from django.utils import timezone
from datetime import timedelta
from core.models import Transaction, PremiumSubscription, Wallet
from .paypal_client import paypal_request, PayPalAPIError


class PaymentError(Exception):
    pass


def _approval_url(order_response):
    for link in order_response.get("links", []):
        if link.get("rel") in ("approve", "payer-action"):
            return link["href"]
    return None


def _create_order(amount_usd, description, return_url, cancel_url):
    body = {
        "intent": "CAPTURE",
        "purchase_units": [{
            "amount": {"currency_code": "USD", "value": f"{amount_usd:.2f}"},
            "description": description,
        }],
        "application_context": {
            "return_url": return_url,
            "cancel_url": cancel_url,
            "user_action": "PAY_NOW",
        },
    }
    return paypal_request("POST", "/v2/checkout/orders", json_body=body)


def _capture_order(order_id):
    return paypal_request("POST", f"/v2/checkout/orders/{order_id}/capture")


def create_token_purchase(user, token_amount):
    usd_amount = round(token_amount * settings.TOKEN_PRICE_USD, 2)
    try:
        order = _create_order(
            usd_amount,
            f"Purchase {token_amount} Predictium tokens",
            f"{settings.PAYPAL_RETURN_URL}?type=purchase&tokens={token_amount}",
            settings.PAYPAL_CANCEL_URL,
        )
    except PayPalAPIError as e:
        raise PaymentError(f"PayPal error: {e.body}")

    order_id = order["id"]
    tx = Transaction.objects.create(
        wallet=user.wallet,
        type="purchase",
        amount=token_amount,
        currency_equivalent=usd_amount,
        status="pending",
        external_payment_id=order_id,
    )
    return {"transaction_id": tx.id, "approval_url": _approval_url(order), "order_id": order_id}


def execute_token_purchase(user, order_id):
    try:
        captured = _capture_order(order_id)
    except PayPalAPIError as e:
        raise PaymentError(f"Capture failed: {e.body}")

    if captured.get("status") != "COMPLETED":
        raise PaymentError(f"Order status: {captured.get('status')}")

    with transaction.atomic():
        tx = Transaction.objects.select_for_update().get(
            external_payment_id=order_id, wallet=user.wallet
        )
        if tx.status != "pending":
            raise PaymentError("Transaction already processed.")
        tx.status = "confirmed"
        tx.confirmed_at = timezone.now()
        tx.save(update_fields=["status", "confirmed_at"])

        wallet = Wallet.objects.select_for_update().get(pk=user.wallet.pk)
        wallet.current_balance += int(tx.amount)
        wallet.save(update_fields=["current_balance"])
    return tx


def create_premium_purchase(user):
    if user.premium_status:
        raise PaymentError("Already a premium member.")

    try:
        order = _create_order(
            float(settings.PREMIUM_PRICE_USD),
            "Predictium Premium Subscription (30 days)",
            f"{settings.PAYPAL_RETURN_URL}?type=premium",
            settings.PAYPAL_CANCEL_URL,
        )
    except PayPalAPIError as e:
        raise PaymentError(f"PayPal error: {e.body}")

    order_id = order["id"]
    tx = Transaction.objects.create(
        wallet=user.wallet,
        type="premium",
        amount=0,
        currency_equivalent=settings.PREMIUM_PRICE_USD,
        status="pending",
        external_payment_id=order_id,
    )
    return {"transaction_id": tx.id, "approval_url": _approval_url(order), "order_id": order_id}


def execute_premium_purchase(user, order_id):
    try:
        captured = _capture_order(order_id)
    except PayPalAPIError as e:
        raise PaymentError(f"Capture failed: {e.body}")

    if captured.get("status") != "COMPLETED":
        raise PaymentError(f"Order status: {captured.get('status')}")

    with transaction.atomic():
        tx = Transaction.objects.select_for_update().get(
            external_payment_id=order_id, wallet=user.wallet
        )
        if tx.status != "pending":
            raise PaymentError("Transaction already processed.")
        tx.status = "confirmed"
        tx.confirmed_at = timezone.now()
        tx.save(update_fields=["status", "confirmed_at"])

        user.premium_status = True
        user.save(update_fields=["premium_status"])

        now = timezone.now()
        PremiumSubscription.objects.update_or_create(
            user=user,
            defaults={
                "start_date": now,
                "end_date": now + timedelta(days=settings.PREMIUM_DURATION_DAYS),
                "status": "active",
            },
        )
    return tx


def _poll_payout_status(batch_id, attempts=4, delay=1.5):
    last = None
    for _ in range(attempts):
        last = paypal_request("GET", f"/v1/payments/payouts/{batch_id}")
        status = last["batch_header"]["batch_status"]
        if status in ("SUCCESS", "DENIED", "CANCELED"):
            return last
        time.sleep(delay)
    return last


def _payout_item_error(payout_response):
    for item in payout_response.get("items", []):
        if item.get("transaction_status") in ("FAILED", "UNCLAIMED", "RETURNED", "REFUNDED", "BLOCKED", "DENIED"):
            err = item.get("errors") or {}
            return f"{item.get('transaction_status')}: {err.get('message', 'unknown error')}"
    return None


def initiate_withdrawal(user, token_amount, paypal_email):
    if token_amount < settings.MIN_WITHDRAWAL_TOKENS:
        raise PaymentError(f"Minimum withdrawal is {settings.MIN_WITHDRAWAL_TOKENS} tokens.")

    wallet = user.wallet
    if wallet.current_balance < token_amount:
        raise PaymentError("Insufficient balance.")

    fee = round(token_amount * settings.TOKEN_WITHDRAWAL_FEE)
    net_tokens = token_amount - fee
    usd_amount = round(net_tokens * settings.TOKEN_PRICE_USD, 2)

    with transaction.atomic():
        wallet = Wallet.objects.select_for_update().get(pk=wallet.pk)
        if wallet.current_balance < token_amount:
            raise PaymentError("Insufficient balance.")
        wallet.current_balance -= token_amount
        wallet.save(update_fields=["current_balance"])

        tx = Transaction.objects.create(
            wallet=wallet,
            type="withdrawal",
            amount=-token_amount,
            currency_equivalent=usd_amount,
            status="pending",
        )

    def _refund_and_reject(reason):
        with transaction.atomic():
            w = Wallet.objects.select_for_update().get(pk=wallet.pk)
            w.current_balance += token_amount
            w.save(update_fields=["current_balance"])
            tx.status = "rejected"
            tx.save(update_fields=["status"])
        raise PaymentError(reason)

    body = {
        "sender_batch_header": {
            "sender_batch_id": f"predictium_tx_{tx.id}",
            "email_subject": "Виплата з Predictium",
            "email_message": f"Дякуємо за використання Predictium! Виведення {net_tokens} токенів.",
        },
        "items": [{
            "recipient_type": "EMAIL",
            "amount": {"value": f"{usd_amount:.2f}", "currency": "USD"},
            "receiver": paypal_email,
            "note": f"Predictium withdrawal #{tx.id}",
            "sender_item_id": f"tx_{tx.id}",
        }],
    }

    try:
        created = paypal_request("POST", "/v1/payments/payouts", json_body=body)
    except PayPalAPIError as e:
        _refund_and_reject(f"PayPal payout failed: {e.body}")

    batch_id = created["batch_header"]["payout_batch_id"]
    tx.external_payment_id = batch_id
    tx.save(update_fields=["external_payment_id"])

    final = _poll_payout_status(batch_id)
    final_status = final["batch_header"]["batch_status"]

    if final_status == "DENIED":
        item_err = _payout_item_error(final) or "Batch denied"
        _refund_and_reject(f"PayPal denied payout: {item_err}")

    item_err = _payout_item_error(final)
    if item_err:
        _refund_and_reject(f"PayPal payout item failed: {item_err}")

    if final_status not in ("SUCCESS", "PROCESSING", "PENDING"):
        _refund_and_reject(f"Unexpected batch status: {final_status}")

    tx.status = "confirmed"
    tx.confirmed_at = timezone.now()
    tx.save(update_fields=["status", "confirmed_at"])

    return {
        "transaction_id": tx.id,
        "tokens_withdrawn": token_amount,
        "fee_tokens": fee,
        "net_tokens": net_tokens,
        "usd_amount": usd_amount,
        "payout_batch_id": batch_id,
        "batch_status": final_status,
    }
