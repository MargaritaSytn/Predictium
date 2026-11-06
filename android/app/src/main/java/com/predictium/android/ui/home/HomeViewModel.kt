package com.predictium.android.ui.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.predictium.android.data.remote.dto.Event
import com.predictium.android.data.remote.dto.User
import com.predictium.android.data.repository.AuthRepository
import com.predictium.android.data.repository.EventRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val eventRepository: EventRepository,
    private val authRepository: AuthRepository
) : ViewModel() {

    val user: StateFlow<User?> = authRepository.currentUser

    private val _events = MutableStateFlow<List<Event>>(emptyList())
    val events: StateFlow<List<Event>> = _events.asStateFlow()

    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _isRefreshing = MutableStateFlow(false)
    val isRefreshing: StateFlow<Boolean> = _isRefreshing.asStateFlow()

    init {
        loadEvents()
    }

    fun loadEvents() {
        viewModelScope.launch {
            eventRepository.getEvents(status = "open")
                .onSuccess { _events.value = it.results }
            _isLoading.value = false
            _isRefreshing.value = false
        }
    }

    fun refresh() {
        _isRefreshing.value = true
        viewModelScope.launch {
            authRepository.loadProfile()
            loadEvents()
        }
    }
}
