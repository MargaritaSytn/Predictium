package com.predictium.android.data.repository

import com.predictium.android.data.remote.api.EventApi
import com.predictium.android.data.remote.dto.*
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class EventRepository @Inject constructor(
    private val eventApi: EventApi
) {
    suspend fun getEvents(
        category: String? = null,
        status: String? = null,
        page: Int = 1
    ): Result<PaginatedResponse<Event>> = runCatching {
        val params = mutableMapOf<String, String>()
        category?.let { params["category"] = it }
        status?.let { params["status"] = it }
        params["page"] = page.toString()
        eventApi.getEvents(params)
    }

    suspend fun getEvent(id: Int): Result<Event> = runCatching {
        eventApi.getEvent(id)
    }

    suspend fun getTopEvents(): Result<TopEventsResponse> = runCatching {
        eventApi.getTopEvents()
    }

    suspend fun getReviews(eventId: Int, page: Int = 1): Result<PaginatedResponse<Review>> = runCatching {
        eventApi.getReviews(eventId, page)
    }

    suspend fun createReview(eventId: Int, rating: Int, commentText: String): Result<Review> = runCatching {
        eventApi.createReview(eventId, CreateReviewRequest(rating, commentText))
    }
}
