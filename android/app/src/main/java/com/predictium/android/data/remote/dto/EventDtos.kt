package com.predictium.android.data.remote.dto

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class Event(
    val id: Int,
    val title: String,
    val description: String,
    val category: String,
    @Json(name = "image_url") val imageUrl: String?,
    val deadline: String,
    val status: String,
    @Json(name = "created_at") val createdAt: String,
    @Json(name = "updated_at") val updatedAt: String? = null,
    val result: String? = null,
    val outcomes: List<EventOutcome>? = null,
    @Json(name = "prediction_count") val predictionCount: Int? = null,
    @Json(name = "review_count") val reviewCount: Int? = null,
    @Json(name = "total_tokens_wagered") val totalTokensWagered: Int? = null
)

@JsonClass(generateAdapter = true)
data class EventOutcome(
    val id: Int,
    val label: String,
    @Json(name = "total_tokens_wagered") val totalTokensWagered: Int,
    @Json(name = "current_coefficient") val currentCoefficient: Double
)

@JsonClass(generateAdapter = true)
data class TopEventsResponse(
    @Json(name = "most_popular") val mostPopular: List<Event>,
    @Json(name = "most_discussed") val mostDiscussed: List<Event>,
    @Json(name = "most_predicted") val mostPredicted: List<Event>
)

@JsonClass(generateAdapter = true)
data class Review(
    val id: Int,
    val username: String,
    val rating: Int,
    @Json(name = "comment_text") val commentText: String,
    @Json(name = "created_at") val createdAt: String,
    @Json(name = "is_approved") val isApproved: Boolean
)

@JsonClass(generateAdapter = true)
data class CreateReviewRequest(
    val rating: Int,
    @Json(name = "comment_text") val commentText: String
)
