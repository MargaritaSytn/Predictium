package com.predictium.android.data.remote.api

import com.predictium.android.data.remote.dto.*
import retrofit2.Response
import retrofit2.http.*

interface EventApi {

    @GET("events/")
    suspend fun getEvents(@QueryMap params: Map<String, String> = emptyMap()): PaginatedResponse<Event>

    @GET("events/{id}/")
    suspend fun getEvent(@Path("id") id: Int): Event

    @GET("events/top/")
    suspend fun getTopEvents(): TopEventsResponse

    @GET("events/{eventId}/reviews/")
    suspend fun getReviews(
        @Path("eventId") eventId: Int,
        @Query("page") page: Int = 1
    ): PaginatedResponse<Review>

    @POST("events/{eventId}/reviews/create/")
    suspend fun createReview(
        @Path("eventId") eventId: Int,
        @Body request: CreateReviewRequest
    ): Review

    @GET("events/moderation/reviews/")
    suspend fun getModerationReviews(@Query("page") page: Int = 1): PaginatedResponse<Review>

    @POST("events/moderation/reviews/{reviewId}/approve/")
    suspend fun approveReview(@Path("reviewId") reviewId: Int): Review

    @POST("events/moderation/reviews/{reviewId}/reject/")
    suspend fun rejectReview(@Path("reviewId") reviewId: Int): Response<Unit>
}
