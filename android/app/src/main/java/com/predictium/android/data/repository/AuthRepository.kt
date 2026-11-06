package com.predictium.android.data.repository

import com.predictium.android.data.local.TokenManager
import com.predictium.android.data.remote.api.AuthApi
import com.predictium.android.data.remote.dto.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepository @Inject constructor(
    private val authApi: AuthApi,
    private val tokenManager: TokenManager
) {
    private val _currentUser = MutableStateFlow<User?>(null)
    val currentUser: StateFlow<User?> = _currentUser.asStateFlow()

    private val _dailyBonusGranted = MutableStateFlow(false)
    val dailyBonusGranted: StateFlow<Boolean> = _dailyBonusGranted.asStateFlow()

    fun isLoggedIn(): Boolean = tokenManager.hasTokens()

    suspend fun login(email: String, password: String): Result<AuthResponse> = runCatching {
        val response = authApi.login(LoginRequest(email, password))
        tokenManager.saveTokens(response.access, response.refresh)
        _currentUser.value = response.user
        _dailyBonusGranted.value = response.dailyBonusGranted == true
        response
    }

    suspend fun register(
        username: String,
        email: String,
        password: String,
        passwordConfirm: String
    ): Result<AuthResponse> = runCatching {
        val response = authApi.register(RegisterRequest(username, email, password, passwordConfirm))
        tokenManager.saveTokens(response.access, response.refresh)
        _currentUser.value = response.user
        response
    }

    suspend fun googleAuth(idToken: String): Result<AuthResponse> = runCatching {
        val response = authApi.googleAuth(GoogleAuthRequest(idToken))
        tokenManager.saveTokens(response.access, response.refresh)
        _currentUser.value = response.user
        _dailyBonusGranted.value = response.dailyBonusGranted == true
        response
    }

    suspend fun facebookAuth(accessToken: String): Result<AuthResponse> = runCatching {
        val response = authApi.facebookAuth(FacebookAuthRequest(accessToken))
        tokenManager.saveTokens(response.access, response.refresh)
        _currentUser.value = response.user
        _dailyBonusGranted.value = response.dailyBonusGranted == true
        response
    }

    suspend fun loadProfile(): Result<User> = runCatching {
        val user = authApi.getProfile()
        _currentUser.value = user
        user
    }

    suspend fun getTopPredictors(): Result<List<TopPredictor>> = runCatching {
        authApi.getTopPredictors()
    }

    fun logout() {
        tokenManager.clearTokens()
        _currentUser.value = null
        _dailyBonusGranted.value = false
    }

    fun clearBonusFlag() {
        _dailyBonusGranted.value = false
    }
}
