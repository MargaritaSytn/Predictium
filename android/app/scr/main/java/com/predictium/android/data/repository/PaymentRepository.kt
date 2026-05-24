package com.predictium.android.data.repository

import com.predictium.android.data.remote.api.PaymentApi
import com.predictium.android.data.remote.dto.*
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class PaymentRepository @Inject constructor(
    private val paymentApi: PaymentApi
) {
    suspend fun purchaseTokens(tokenAmount: Int): Result<PurchaseResponse> = runCatching {
        paymentApi.purchaseTokens(PurchaseRequest(tokenAmount))
    }

    suspend fun executePurchase(paymentId: String, payerId: String): Result<Map<String, String>> = runCatching {
        paymentApi.executePurchase(ExecutePurchaseRequest(paymentId, payerId))
    }

    suspend fun purchasePremium(): Result<PurchaseResponse> = runCatching {
        paymentApi.purchasePremium()
    }

    suspend fun executePremium(paymentId: String, payerId: String): Result<Map<String, String>> = runCatching {
        paymentApi.executePremium(ExecutePurchaseRequest(paymentId, payerId))
    }

    suspend fun withdraw(tokenAmount: Int): Result<WithdrawResponse> = runCatching {
        paymentApi.withdraw(WithdrawRequest(tokenAmount))
    }

    suspend fun getTransactions(page: Int = 1, type: String? = null): Result<PaginatedResponse<Transaction>> = runCatching {
        paymentApi.getTransactions(page, type)
    }
}
