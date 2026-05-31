package com.predictium.android.ui.profile

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.predictium.android.data.remote.dto.PublicUser
import com.predictium.android.data.repository.SocialRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class PublicProfileViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val socialRepository: SocialRepository
) : ViewModel() {

    val userId: Int = savedStateHandle["userId"] ?: 0

    private val _user = MutableStateFlow<PublicUser?>(null)
    val user: StateFlow<PublicUser?> = _user.asStateFlow()

    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    init {
        loadProfile()
    }

    fun loadProfile() {
        viewModelScope.launch {
            socialRepository.getPublicProfile(userId)
                .onSuccess { _user.value = it }
            _isLoading.value = false
        }
    }

    fun toggleFollow() {
        val currentUser = _user.value ?: return
        viewModelScope.launch {
            if (currentUser.isFollowing) {
                socialRepository.unfollowUser(userId).onSuccess { loadProfile() }
            } else {
                socialRepository.followUser(userId).onSuccess { loadProfile() }
            }
        }
    }

    fun reportUser(reason: String, description: String?) {
        viewModelScope.launch {
            socialRepository.reportUser(
                reportedUserId = userId,
                reportedReviewId = null,
                reason = reason,
                description = description
            )
        }
    }
}
