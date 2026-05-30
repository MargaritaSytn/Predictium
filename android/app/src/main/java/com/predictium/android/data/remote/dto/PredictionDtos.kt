package com.predictium.android.data.remote.dto

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class PlacePredictionRequest(
    val event: Int,
    @Json(name = "selected_outcome") val selectedOutcome: Int,
    @Json(name = "amount_tokens") val amountTokens: Int
)

@JsonClass(generateAdapter = true)
data class Prediction(
    val id: Int,
    val event: Int,
    @Json(name = "event_title") val eventTitle: String,
    @Json(name = "selected_outcome") val selectedOutcome: Int,
    @Json(name = "outcome_label") val outcomeLabel: String,
    @Json(name = "amount_tokens") val amountTokens: Int,
    @Json(name = "locked_coefficient") val lockedCoefficient: Double,
    @Json(name = "prediction_status") val predictionStatus: String,
    @Json(name = "payout_amount") val payoutAmount: Double,
    @Json(name = "created_at") val createdAt: String
)
