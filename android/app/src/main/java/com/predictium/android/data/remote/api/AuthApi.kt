package com.predictium.android.data.remote.api

import com.predictium.android.data.remote.dto.*
import retrofit2.Response
import retrofit2.http.*

interface AuthApi {

    @POST("auth/login/")
    suspend fun login(@Body request: LoginRequest): AuthResponse

    @POST("auth/register/")
    suspend fun register(@Body request: RegisterRequest): AuthResponse

    @POST("auth/token/refresh/")
    suspend fun refreshToken(@Body request: RefreshTokenRequest): RefreshTokenResponse

    @GET("auth/profile/")
    suspend fun getProfile(): User

    @GET("auth/top-predictors/")
    suspend fun getTopPredictors(): List<TopPredictor>

    @GET("auth/users/{id}/")
    suspend fun getPublicProfile(@Path("id") id: Int): PublicUser

    @POST("auth/users/{id}/follow/")
    suspend fun followUser(@Path("id") id: Int): Response<Unit>

    @DELETE("auth/users/{id}/follow/")
    suspend fun unfollowUser(@Path("id") id: Int): Response<Unit>

    @GET("auth/users/{id}/followers/")
    suspend fun getFollowers(
        @Path("id") id: Int,
        @Query("page") page: Int = 1
    ): PaginatedResponse<PublicUser>

    @GET("auth/users/{id}/following/")
    suspend fun getFollowing(
        @Path("id") id: Int,
        @Query("page") page: Int = 1
    ): PaginatedResponse<PublicUser>

    @POST("auth/reports/")
    suspend fun createReport(@Body request: Map<String, @JvmSuppressWildcards Any?>): Response<Unit>

    @POST("auth/google/")
    suspend fun googleAuth(@Body request: GoogleAuthRequest): AuthResponse

    @POST("auth/facebook/")
    suspend fun facebookAuth(@Body request: FacebookAuthRequest): AuthResponse
}
