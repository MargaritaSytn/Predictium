package com.predictium.android.data.remote.api

import com.predictium.android.data.remote.dto.Notification
import com.predictium.android.data.remote.dto.PaginatedResponse
import com.predictium.android.data.remote.dto.UnreadCountResponse
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

interface NotificationApi {

    @GET("notifications/")
    suspend fun getNotifications(@Query("page") page: Int = 1): PaginatedResponse<Notification>

    @GET("notifications/unread-count/")
    suspend fun getUnreadCount(): UnreadCountResponse

    @POST("notifications/{id}/read/")
    suspend fun markRead(@Path("id") id: Int): Notification

    @POST("notifications/read-all/")
    suspend fun markAllRead(): Response<Unit>

    @POST("notifications/device-token/")
    suspend fun registerDeviceToken(@Body request: Map<String, String>): Response<Unit>
}
