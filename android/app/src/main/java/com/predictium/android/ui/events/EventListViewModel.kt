package com.predictium.android.ui.events

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.predictium.android.data.remote.dto.Event
import com.predictium.android.data.repository.EventRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class EventListViewModel @Inject constructor(
    private val eventRepository: EventRepository
) : ViewModel() {

    private val _events = MutableStateFlow<List<Event>>(emptyList())
    val events: StateFlow<List<Event>> = _events.asStateFlow()

    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _selectedCategory = MutableStateFlow("all")
    val selectedCategory: StateFlow<String> = _selectedCategory.asStateFlow()

    private val _currentPage = MutableStateFlow(1)
    private val _hasMore = MutableStateFlow(true)
    val hasMore: StateFlow<Boolean> = _hasMore.asStateFlow()

    init {
        loadEvents()
    }

    fun selectCategory(category: String) {
        _selectedCategory.value = category
        _currentPage.value = 1
        _events.value = emptyList()
        _isLoading.value = true
        loadEvents()
    }

    fun loadEvents() {
        viewModelScope.launch {
            val category = _selectedCategory.value.takeIf { it != "all" }
            eventRepository.getEvents(category = category, page = _currentPage.value)
                .onSuccess { response ->
                    if (_currentPage.value == 1) {
                        _events.value = response.results
                    } else {
                        _events.value = _events.value + response.results
                    }
                    _hasMore.value = response.next != null
                }
            _isLoading.value = false
        }
    }

    fun loadMore() {
        if (!_hasMore.value) return
        _currentPage.value++
        loadEvents()
    }
}
