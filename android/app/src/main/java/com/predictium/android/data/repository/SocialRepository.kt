package com.predictium.android.data.repository

import com.predictium.android.data.remote.api.AuthApi
import com.predictium.android.data.remote.dto.PaginatedResponse
import com.predictium.android.data.remote.dto.PublicUser
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SocialRepository @Inject constructor(
    private val authApi: AuthApi
) {
    suspend fun getPublicProfile(userId: Int): Result<PublicUser> = runCatching {
        authApi.getPublicProfile(userId)
    }

    suspend fun followUser(userId: Int): Result<Unit> = runCatching {
        authApi.followUser(userId)
        Unit
    }

    suspend fun unfollowUser(userId: Int): Result<Unit> = runCatching {
        authApi.unfollowUser(userId)
        Unit
    }

    suspend fun getFollowers(userId: Int, page: Int = 1): Result<PaginatedResponse<PublicUser>> = runCatching {
        authApi.getFollowers(userId, page)
    }

    suspend fun getFollowing(userId: Int, page: Int = 1): Result<PaginatedResponse<PublicUser>> = runCatching {
        authApi.getFollowing(userId, page)
    }

    suspend fun reportUser(
        reportedUserId: Int?,
        reportedReviewId: Int?,
        reason: String,
        description: String?
    ): Result<Unit> = runCatching {
        val body = mutableMapOf<String, Any?>()
        reportedUserId?.let { body["reported_user"] = it }
        reportedReviewId?.let { body["reported_review"] = it }
        body["reason"] = reason
        description?.let { body["description"] = it }
        authApi.createReport(body)
        Unit
    }
}
