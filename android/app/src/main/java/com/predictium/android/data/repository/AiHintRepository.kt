package com.predictium.android.data.repository

import com.predictium.android.data.remote.api.AiHintApi
import com.predictium.android.data.remote.dto.HintResponse
import com.predictium.android.data.remote.dto.HintStatus
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AiHintRepository @Inject constructor(
    private val aiHintApi: AiHintApi
) {
    suspend fun getHintStatus(): Result<HintStatus> = runCatching {
        aiHintApi.getHintStatus()
    }

    suspend fun getHint(eventId: Int): Result<HintResponse> = runCatching {
        aiHintApi.getHint(eventId)
    }
}
