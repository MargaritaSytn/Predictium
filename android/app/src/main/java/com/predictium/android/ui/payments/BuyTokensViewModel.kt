package com.predictium.android.ui.payments

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.predictium.android.data.repository.PaymentRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class BuyTokensViewModel @Inject constructor(
    private val paymentRepository: PaymentRepository
) : ViewModel() {

    private val _approvalUrl = MutableStateFlow<String?>(null)
    val approvalUrl: StateFlow<String?> = _approvalUrl.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    fun purchaseTokens(amount: Int) {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            paymentRepository.purchaseTokens(amount)
                .onSuccess { _approvalUrl.value = it.getUrl() }
                .onFailure { _error.value = it.message ?: "Purchase failed" }
            _isLoading.value = false
        }
    }

    fun clearError() { _error.value = null }
    fun clearApprovalUrl() { _approvalUrl.value = null }
}
