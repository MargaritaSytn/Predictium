package com.predictium.android.data.remote.interceptor

import com.predictium.android.data.local.TokenManager
import com.predictium.android.data.remote.dto.RefreshTokenRequest
import com.predictium.android.data.remote.dto.RefreshTokenResponse
import com.squareup.moshi.Moshi
import okhttp3.Authenticator
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import okhttp3.Route
import javax.inject.Inject
import javax.inject.Named

class TokenRefreshAuthenticator @Inject constructor(
    private val tokenManager: TokenManager,
    @Named("baseUrl") private val baseUrl: String,
    private val moshi: Moshi
) : Authenticator {

    private val refreshClient = OkHttpClient()
    private val lock = Any()

    override fun authenticate(route: Route?, response: Response): Request? {
        val refreshToken = tokenManager.getRefreshToken() ?: run {
            tokenManager.clearTokens()
            return null
        }

        // Avoid infinite retry loops
        if (response.request.header("X-Retry") != null) {
            tokenManager.clearTokens()
            return null
        }

        synchronized(lock) {
            // Check if another thread already refreshed the token
            val currentToken = tokenManager.getAccessToken()
            val requestToken = response.request.header("Authorization")?.removePrefix("Bearer ")
            if (currentToken != null && currentToken != requestToken) {
                return response.request.newBuilder()
                    .header("Authorization", "Bearer $currentToken")
                    .header("X-Retry", "true")
                    .build()
            }

            val adapter = moshi.adapter(RefreshTokenRequest::class.java)
            val body = adapter.toJson(RefreshTokenRequest(refreshToken))
                .toRequestBody("application/json".toMediaType())

            val refreshRequest = Request.Builder()
                .url("${baseUrl.trimEnd('/')}/auth/token/refresh/")
                .post(body)
                .build()

            return try {
                val refreshResponse = refreshClient.newCall(refreshRequest).execute()
                if (refreshResponse.isSuccessful) {
                    val responseAdapter = moshi.adapter(RefreshTokenResponse::class.java)
                    val tokenResponse = responseAdapter.fromJson(
                        refreshResponse.body?.string() ?: ""
                    )
                    if (tokenResponse != null) {
                        tokenManager.saveAccessToken(tokenResponse.access)
                        response.request.newBuilder()
                            .header("Authorization", "Bearer ${tokenResponse.access}")
                            .header("X-Retry", "true")
                            .build()
                    } else {
                        tokenManager.clearTokens()
                        null
                    }
                } else {
                    tokenManager.clearTokens()
                    null
                }
            } catch (_: Exception) {
                tokenManager.clearTokens()
                null
            }
        }
    }
}
