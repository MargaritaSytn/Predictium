package com.predictium.android.ui.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.predictium.android.data.remote.dto.Prediction
import com.predictium.android.data.remote.dto.Transaction
import com.predictium.android.data.remote.dto.User
import com.predictium.android.data.repository.AuthRepository
import com.predictium.android.data.repository.PaymentRepository
import com.predictium.android.data.repository.PredictionRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val predictionRepository: PredictionRepository,
    private val paymentRepository: PaymentRepository
) : ViewModel() {

    val user: StateFlow<User?> = authRepository.currentUser

    private val _predictions = MutableStateFlow<List<Prediction>>(emptyList())
    val predictions: StateFlow<List<Prediction>> = _predictions.asStateFlow()

    private val _transactions = MutableStateFlow<List<Transaction>>(emptyList())
    val transactions: StateFlow<List<Transaction>> = _transactions.asStateFlow()

    private val _selectedTab = MutableStateFlow(0)
    val selectedTab: StateFlow<Int> = _selectedTab.asStateFlow()

    init {
        loadData()
    }

    fun selectTab(index: Int) {
        _selectedTab.value = index
    }

    fun loadData() {
        viewModelScope.launch {
            authRepository.loadProfile()
            predictionRepository.getMyPredictions()
                .onSuccess { _predictions.value = it.results }
            paymentRepository.getTransactions()
                .onSuccess { _transactions.value = it.results }
        }
    }
}
