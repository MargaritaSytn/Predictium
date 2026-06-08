package com.predictium.android.ui.payments

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.predictium.android.data.remote.dto.User
import com.predictium.android.data.repository.AuthRepository
import com.predictium.android.data.repository.PaymentRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class WithdrawViewModel @Inject constructor(
    private val paymentRepository: PaymentRepository,
    private val authRepository: AuthRepository
) : ViewModel() {

    val user: StateFlow<User?> = authRepository.currentUser

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _success = MutableStateFlow<String?>(null)
    val success: StateFlow<String?> = _success.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    fun withdraw(amount: Int, paypalEmail: String) {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            paymentRepository.withdraw(amount, paypalEmail)
                .onSuccess { response ->
                    val msg = "Виведення успішне! " +
                        "${response.tokensWithdrawn ?: amount} токенів → " +
                        "$${"%.2f".format(response.usdAmount ?: 0.0)} USD"
                    _success.value = msg
                    authRepository.loadProfile()
                }
                .onFailure { _error.value = it.message ?: "Помилка виводу" }
            _isLoading.value = false
        }
    }

    fun clearSuccess() { _success.value = null }
    fun clearError() { _error.value = null }

    companion object {
        const val MIN_WITHDRAWAL = 100
        const val FEE_RATE = 0.03
        const val TOKEN_PRICE = 0.10
    }
}
