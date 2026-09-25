package com.predictium.android.data.remote.api

import com.predictium.android.data.remote.dto.HintResponse
import com.predictium.android.data.remote.dto.HintStatus
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path

interface AiHintApi {

    @GET("ai-hints/status/")
    suspend fun getHintStatus(): HintStatus

    @POST("ai-hints/{eventId}/")
    suspend fun getHint(@Path("eventId") eventId: Int): HintResponse
}
