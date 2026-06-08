package com.predictium.android.data.remote.dto

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class PurchaseRequest(
    @Json(name = "token_amount") val tokenAmount: Int,
    @Json(name = "platform") val platform: String = "android",
)

@JsonClass(generateAdapter = true)
data class PurchaseResponse(
    @Json(name = "approval_url") val approvalUrl: String? = null,
    @Json(name = "approval_link") val approvalLink: String? = null,
    @Json(name = "order_id") val orderId: String? = null,
) {
    fun getUrl(): String = approvalUrl ?: approvalLink ?: ""
    fun requireOrderId(): String = orderId.orEmpty()
}

@JsonClass(generateAdapter = true)
data class ExecutePurchaseRequest(
    @Json(name = "order_id") val orderId: String
)

@JsonClass(generateAdapter = true)
data class WithdrawRequest(
    @Json(name = "token_amount") val tokenAmount: Int
)

@JsonClass(generateAdapter = true)
data class WithdrawResponse(
    @Json(name = "withdrawal_id") val withdrawalId: Int? = null,
    val status: String? = null,
    @Json(name = "amount_tokens") val amountTokens: Int? = null,
    val fee: Int? = null,
    @Json(name = "net_usd") val netUsd: Double? = null,
    val detail: String? = null
)

@JsonClass(generateAdapter = true)
data class Transaction(
    val id: Int,
    val type: String,
    val amount: Double,
    @Json(name = "currency_equivalent") val currencyEquivalent: Double,
    val status: String,
    val description: String? = null,
    @Json(name = "created_at") val createdAt: String,
    @Json(name = "confirmed_at") val confirmedAt: String? = null
)
