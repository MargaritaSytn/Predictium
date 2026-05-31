package com.predictium.android.data.remote.dto

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class LoginRequest(
    val email: String,
    val password: String
)

@JsonClass(generateAdapter = true)
data class RegisterRequest(
    val username: String,
    val email: String,
    val password: String,
    @Json(name = "password_confirm") val passwordConfirm: String
)

@JsonClass(generateAdapter = true)
data class RefreshTokenRequest(
    val refresh: String
)

@JsonClass(generateAdapter = true)
data class RefreshTokenResponse(
    val access: String
)

@JsonClass(generateAdapter = true)
data class AuthResponse(
    val user: User,
    val access: String,
    val refresh: String,
    @Json(name = "daily_bonus_granted") val dailyBonusGranted: Boolean?
)

@JsonClass(generateAdapter = true)
data class User(
    val id: Int,
    val username: String,
    val email: String,
    @Json(name = "token_balance") val tokenBalance: Int,
    @Json(name = "premium_status") val premiumStatus: Boolean,
    @Json(name = "is_staff") val isStaff: Boolean,
    @Json(name = "registration_date") val registrationDate: String,
    val bio: String,
    @Json(name = "success_rate") val successRate: Double,
    @Json(name = "won_predictions") val wonPredictions: Int,
    @Json(name = "total_predictions") val totalPredictions: Int,
    @Json(name = "wallet_balance") val walletBalance: Int
)

@JsonClass(generateAdapter = true)
data class PublicUser(
    val id: Int,
    val username: String,
    @Json(name = "registration_date") val registrationDate: String,
    @Json(name = "premium_status") val premiumStatus: Boolean,
    val bio: String,
    @Json(name = "success_rate") val successRate: Double,
    @Json(name = "total_predictions") val totalPredictions: Int,
    @Json(name = "won_predictions") val wonPredictions: Int,
    @Json(name = "followers_count") val followersCount: Int,
    @Json(name = "following_count") val followingCount: Int,
    @Json(name = "is_following") val isFollowing: Boolean
)

@JsonClass(generateAdapter = true)
data class TopPredictor(
    val id: Int,
    val username: String,
    @Json(name = "success_rate") val successRate: Double
)

@JsonClass(generateAdapter = true)
data class GoogleAuthRequest(
    @Json(name = "id_token") val idToken: String
)

@JsonClass(generateAdapter = true)
data class FacebookAuthRequest(
    @Json(name = "access_token") val accessToken: String
)
