package com.predictium.android.data.repository

import com.predictium.android.data.remote.api.NotificationApi
import com.predictium.android.data.remote.dto.Notification
import com.predictium.android.data.remote.dto.PaginatedResponse
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class NotificationRepository @Inject constructor(
    private val notificationApi: NotificationApi
) {
    private val _unreadCount = MutableStateFlow(0)
    val unreadCount: StateFlow<Int> = _unreadCount.asStateFlow()

    suspend fun getNotifications(page: Int = 1): Result<PaginatedResponse<Notification>> = runCatching {
        notificationApi.getNotifications(page)
    }

    suspend fun refreshUnreadCount(): Result<Int> = runCatching {
        val response = notificationApi.getUnreadCount()
        _unreadCount.value = response.unreadCount
        response.unreadCount
    }

    suspend fun markRead(id: Int): Result<Notification> = runCatching {
        val notification = notificationApi.markRead(id)
        refreshUnreadCount()
        notification
    }

    suspend fun markAllRead(): Result<Unit> = runCatching {
        notificationApi.markAllRead()
        _unreadCount.value = 0
    }

    suspend fun registerDeviceToken(token: String, tokenType: String = "fcm"): Result<Unit> = runCatching {
        notificationApi.registerDeviceToken(mapOf("token" to token, "token_type" to tokenType))
        Unit
    }
}
