from django.urls import path
from .views import (
    PurchaseTokensView, ExecuteTokenPurchaseView,
    PurchasePremiumView, ExecutePremiumPurchaseView,
    WithdrawView, TransactionListView,
    PayPalReturnView, PayPalCancelView,
)

urlpatterns = [
    path("purchase/", PurchaseTokensView.as_view(), name="purchase-tokens"),
    path("purchase/execute/", ExecuteTokenPurchaseView.as_view(), name="execute-purchase"),
    path("premium/", PurchasePremiumView.as_view(), name="purchase-premium"),
    path("premium/execute/", ExecutePremiumPurchaseView.as_view(), name="execute-premium"),
    path("withdraw/", WithdrawView.as_view(), name="withdraw"),
    path("transactions/", TransactionListView.as_view(), name="transactions"),
    path("paypal/return/", PayPalReturnView.as_view(), name="paypal-return"),
    path("paypal/cancel/", PayPalCancelView.as_view(), name="paypal-cancel"),
]
