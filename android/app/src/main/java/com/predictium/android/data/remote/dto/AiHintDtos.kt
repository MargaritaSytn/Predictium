package com.predictium.android.data.remote.dto

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class HintResponse(
    @Json(name = "hint_text") val hintText: String,
    @Json(name = "hints_used_today") val hintsUsedToday: Int,
    @Json(name = "hints_remaining") val hintsRemaining: Int
)

@JsonClass(generateAdapter = true)
data class HintStatus(
    @Json(name = "hints_used_today") val hintsUsedToday: Int,
    @Json(name = "hints_remaining") val hintsRemaining: Int,
    @Json(name = "daily_limit") val dailyLimit: Int
)
