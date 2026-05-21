package com.predictium.android.data.remote.dto

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class Notification(
    val id: Int,
    val type: String,
    val title: String,
    val message: String,
    @Json(name = "send_time") val sendTime: String,
    @Json(name = "is_read") val isRead: Boolean
)

@JsonClass(generateAdapter = true)
data class UnreadCountResponse(
    @Json(name = "unread_count") val unreadCount: Int
)
