package com.predictium.android.ui.events

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.predictium.android.data.remote.dto.Event
import com.predictium.android.data.remote.dto.HintResponse
import com.predictium.android.data.remote.dto.HintStatus
import com.predictium.android.data.remote.dto.Prediction
import com.predictium.android.data.remote.dto.Review
import com.predictium.android.data.repository.AiHintRepository
import com.predictium.android.data.repository.AuthRepository
import com.predictium.android.data.repository.EventRepository
import com.predictium.android.data.repository.PredictionRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class EventDetailViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val eventRepository: EventRepository,
    private val predictionRepository: PredictionRepository,
    private val aiHintRepository: AiHintRepository,
    private val authRepository: AuthRepository
) : ViewModel() {

    val eventId: Int = savedStateHandle["eventId"] ?: 0

    private val _event = MutableStateFlow<Event?>(null)
    val event: StateFlow<Event?> = _event.asStateFlow()

    private val _reviews = MutableStateFlow<List<Review>>(emptyList())
    val reviews: StateFlow<List<Review>> = _reviews.asStateFlow()

    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _predictionResult = MutableStateFlow<Prediction?>(null)
    val predictionResult: StateFlow<Prediction?> = _predictionResult.asStateFlow()

    private val _predictionError = MutableStateFlow<String?>(null)
    val predictionError: StateFlow<String?> = _predictionError.asStateFlow()

    private val _hintStatus = MutableStateFlow<HintStatus?>(null)
    val hintStatus: StateFlow<HintStatus?> = _hintStatus.asStateFlow()

    private val _hintResponse = MutableStateFlow<HintResponse?>(null)
    val hintResponse: StateFlow<HintResponse?> = _hintResponse.asStateFlow()

    private val _hintLoading = MutableStateFlow(false)
    val hintLoading: StateFlow<Boolean> = _hintLoading.asStateFlow()

    private val _reviewError = MutableStateFlow<String?>(null)
    val reviewError: StateFlow<String?> = _reviewError.asStateFlow()

    init {
        loadEvent()
        loadReviews()
        loadHintStatus()
    }

    fun loadEvent() {
        viewModelScope.launch {
            eventRepository.getEvent(eventId)
                .onSuccess { _event.value = it }
            _isLoading.value = false
        }
    }

    fun loadReviews() {
        viewModelScope.launch {
            eventRepository.getReviews(eventId)
                .onSuccess { _reviews.value = it.results }
        }
    }

    fun placePrediction(outcomeId: Int, amount: Int) {
        viewModelScope.launch {
            _predictionError.value = null
            predictionRepository.placePrediction(eventId, outcomeId, amount)
                .onSuccess {
                    _predictionResult.value = it
                    authRepository.loadProfile()
                    loadEvent()
                }
                .onFailure {
                    _predictionError.value = it.message ?: "Prediction failed"
                }
        }
    }

    fun createReview(rating: Int, commentText: String) {
        viewModelScope.launch {
            _reviewError.value = null
            eventRepository.createReview(eventId, rating, commentText)
                .onSuccess { loadReviews() }
                .onFailure { _reviewError.value = it.message ?: "Review failed" }
        }
    }

    private fun loadHintStatus() {
        viewModelScope.launch {
            aiHintRepository.getHintStatus()
                .onSuccess { _hintStatus.value = it }
        }
    }

    fun requestHint() {
        viewModelScope.launch {
            _hintLoading.value = true
            aiHintRepository.getHint(eventId)
                .onSuccess {
                    _hintResponse.value = it
                    _hintStatus.value = _hintStatus.value?.copy(
                        hintsUsedToday = it.hintsUsedToday,
                        hintsRemaining = it.hintsRemaining
                    )
                }
            _hintLoading.value = false
        }
    }

    fun clearPredictionResult() {
        _predictionResult.value = null
    }

    fun clearPredictionError() {
        _predictionError.value = null
    }
}
