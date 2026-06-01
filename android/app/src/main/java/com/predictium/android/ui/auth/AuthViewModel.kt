package com.predictium.android.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.predictium.android.data.remote.dto.User
import com.predictium.android.data.repository.AuthRepository
import com.predictium.android.data.repository.NotificationRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val notificationRepository: NotificationRepository
) : ViewModel() {

    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _isLoggedIn = MutableStateFlow(false)
    val isLoggedIn: StateFlow<Boolean> = _isLoggedIn.asStateFlow()

    val currentUser: StateFlow<User?> = authRepository.currentUser
    val dailyBonusGranted: StateFlow<Boolean> = authRepository.dailyBonusGranted
    val unreadNotificationCount: StateFlow<Int> = notificationRepository.unreadCount

    private val _loginError = MutableStateFlow<String?>(null)
    val loginError: StateFlow<String?> = _loginError.asStateFlow()

    private val _registerError = MutableStateFlow<String?>(null)
    val registerError: StateFlow<String?> = _registerError.asStateFlow()

    private val _authLoading = MutableStateFlow(false)
    val authLoading: StateFlow<Boolean> = _authLoading.asStateFlow()

    init {
        viewModelScope.launch {
            if (authRepository.isLoggedIn()) {
                authRepository.loadProfile()
                    .onSuccess {
                        _isLoggedIn.value = true
                        startUnreadPolling()
                    }
                    .onFailure {
                        authRepository.logout()
                    }
            }
            _isLoading.value = false
        }
    }

    fun login(email: String, password: String) {
        viewModelScope.launch {
            _authLoading.value = true
            _loginError.value = null
            authRepository.login(email.trim().lowercase(), password)
                .onSuccess {
                    _isLoggedIn.value = true
                    startUnreadPolling()
                }
                .onFailure { e ->
                    _loginError.value = e.message ?: "Login failed"
                }
            _authLoading.value = false
        }
    }

    fun register(username: String, email: String, password: String, passwordConfirm: String) {
        viewModelScope.launch {
            _authLoading.value = true
            _registerError.value = null
            authRepository.register(username.trim(), email.trim().lowercase(), password, passwordConfirm)
                .onSuccess {
                    _isLoggedIn.value = true
                    startUnreadPolling()
                }
                .onFailure { e ->
                    _registerError.value = e.message ?: "Registration failed"
                }
            _authLoading.value = false
        }
    }

    fun googleSignIn(idToken: String) {
        viewModelScope.launch {
            _authLoading.value = true
            _loginError.value = null
            authRepository.googleAuth(idToken)
                .onSuccess {
                    _isLoggedIn.value = true
                    startUnreadPolling()
                }
                .onFailure { e ->
                    _loginError.value = e.message ?: "Не вдалось увійти через Google"
                }
            _authLoading.value = false
        }
    }

    fun facebookSignIn(accessToken: String) {
        viewModelScope.launch {
            _authLoading.value = true
            _loginError.value = null
            authRepository.facebookAuth(accessToken)
                .onSuccess {
                    _isLoggedIn.value = true
                    startUnreadPolling()
                }
                .onFailure { e ->
                    _loginError.value = e.message ?: "Не вдалось увійти через Facebook"
                }
            _authLoading.value = false
        }
    }

    fun showAuthError(message: String) {
        _loginError.value = message
    }

    fun logout() {
        authRepository.logout()
        _isLoggedIn.value = false
    }

    fun clearLoginError() {
        _loginError.value = null
    }

    fun clearRegisterError() {
        _registerError.value = null
    }

    fun clearBonusFlag() {
        authRepository.clearBonusFlag()
    }

    fun refreshUser() {
        viewModelScope.launch {
            authRepository.loadProfile()
        }
    }

    private fun startUnreadPolling() {
        viewModelScope.launch {
            while (true) {
                notificationRepository.refreshUnreadCount()
                delay(60_000)
            }
        }
    }
}
