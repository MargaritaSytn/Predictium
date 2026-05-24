import paypalrestsdk
from django.conf import settings
from django.db import transaction
from django.utils import timezone
from core.models import Transaction, PremiumSubscription
from datetime import timedelta


def _get_paypal_api():
    return paypalrestsdk.Api({
        "mode": settings.PAYPAL_MODE,
        "client_id": settings.PAYPAL_CLIENT_ID,
        "client_secret": settings.PAYPAL_CLIENT_SECRET,
    })


class PaymentError(Exception):
    pass


def create_token_purchase(user, token_amount):
    usd_amount = round(token_amount * settings.TOKEN_PRICE_USD, 2)
    api = _get_paypal_api()

    payment = paypalrestsdk.Payment({
        "intent": "sale",
        "payer": {"payment_method": "paypal"},
        "redirect_urls": {
            "return_url": f"{settings.PAYPAL_RETURN_URL}?type=purchase&tokens={token_amount}",
            "cancel_url": settings.PAYPAL_CANCEL_URL,
        },
        "transactions": [{
            "amount": {"total": str(usd_amount), "currency": "USD"},
            "description": f"Purchase {token_amount} Predictium tokens",
        }],
    }, api=api)

    if not payment.create():
        raise PaymentError(f"PayPal error: {payment.error}")

    wallet = user.wallet
    tx = Transaction.objects.create(
        wallet=wallet,
        type="purchase",
        amount=token_amount,
        currency_equivalent=usd_amount,
        status="pending",
        external_payment_id=payment.id,
    )

    approval_url = next(
        (link.href for link in payment.links if link.rel == "approval_url"), None
    )
    return {"transaction_id": tx.id, "approval_url": approval_url, "paypal_id": payment.id}


def execute_token_purchase(user, payment_id, payer_id):
    api = _get_paypal_api()
    payment = paypalrestsdk.Payment.find(payment_id, api=api)

    if not payment.execute({"payer_id": payer_id}):
        raise PaymentError(f"Payment execution failed: {payment.error}")

    with transaction.atomic():
        tx = Transaction.objects.select_for_update().get(
            external_payment_id=payment_id, wallet=user.wallet
        )
        if tx.status != "pending":
            raise PaymentError("Transaction already processed.")

        tx.status = "confirmed"
        tx.confirmed_at = timezone.now()
        tx.save()

        wallet = user.wallet
        wallet.current_balance += int(tx.amount)
        wallet.save()

    return tx


def create_premium_purchase(user):
    if user.premium_status:
        raise PaymentError("Already a premium member.")

    api = _get_paypal_api()
    payment = paypalrestsdk.Payment({
        "intent": "sale",
        "payer": {"payment_method": "paypal"},
        "redirect_urls": {
            "return_url": f"{settings.PAYPAL_RETURN_URL}?type=premium",
            "cancel_url": settings.PAYPAL_CANCEL_URL,
        },
        "transactions": [{
            "amount": {"total": str(settings.PREMIUM_PRICE_USD), "currency": "USD"},
            "description": "Predictium Premium Subscription (30 days)",
        }],
    }, api=api)

    if not payment.create():
        raise PaymentError(f"PayPal error: {payment.error}")

    tx = Transaction.objects.create(
        wallet=user.wallet,
        type="premium",
        amount=0,
        currency_equivalent=settings.PREMIUM_PRICE_USD,
        status="pending",
        external_payment_id=payment.id,
    )

    approval_url = next(
        (link.href for link in payment.links if link.rel == "approval_url"), None
    )
    return {"transaction_id": tx.id, "approval_url": approval_url, "paypal_id": payment.id}


def execute_premium_purchase(user, payment_id, payer_id):
    api = _get_paypal_api()
    payment = paypalrestsdk.Payment.find(payment_id, api=api)

    if not payment.execute({"payer_id": payer_id}):
        raise PaymentError(f"Payment execution failed: {payment.error}")

    with transaction.atomic():
        tx = Transaction.objects.select_for_update().get(
            external_payment_id=payment_id, wallet=user.wallet
        )
        if tx.status != "pending":
            raise PaymentError("Transaction already processed.")

        tx.status = "confirmed"
        tx.confirmed_at = timezone.now()
        tx.save()

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


def initiate_withdrawal(user, token_amount):
    if token_amount < settings.MIN_WITHDRAWAL_TOKENS:
        raise PaymentError(f"Minimum withdrawal is {settings.MIN_WITHDRAWAL_TOKENS} tokens.")

    wallet = user.wallet
    if wallet.current_balance < token_amount:
        raise PaymentError("Insufficient balance.")

    fee = round(token_amount * settings.TOKEN_WITHDRAWAL_FEE)
    net_tokens = token_amount - fee
    usd_amount = round(net_tokens * settings.TOKEN_PRICE_USD, 2)

    with transaction.atomic():
        wallet.current_balance -= token_amount
        wallet.save()

        tx = Transaction.objects.create(
            wallet=wallet,
            type="withdrawal",
            amount=-token_amount,
            currency_equivalent=usd_amount,
            status="pending",
        )

    return {
        "transaction_id": tx.id,
        "tokens_withdrawn": token_amount,
        "fee_tokens": fee,
        "net_tokens": net_tokens,
        "usd_amount": usd_amount,
    }
