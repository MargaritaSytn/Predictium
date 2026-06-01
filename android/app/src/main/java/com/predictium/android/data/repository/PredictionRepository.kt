package com.predictium.android.data.repository

import com.predictium.android.data.remote.api.PredictionApi
import com.predictium.android.data.remote.dto.PaginatedResponse
import com.predictium.android.data.remote.dto.PlacePredictionRequest
import com.predictium.android.data.remote.dto.Prediction
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class PredictionRepository @Inject constructor(
    private val predictionApi: PredictionApi
) {
    suspend fun placePrediction(
        eventId: Int,
        outcomeId: Int,
        amountTokens: Int
    ): Result<Prediction> = runCatching {
        predictionApi.placePrediction(
            PlacePredictionRequest(eventId, outcomeId, amountTokens)
        )
    }

    suspend fun getMyPredictions(page: Int = 1): Result<PaginatedResponse<Prediction>> = runCatching {
        predictionApi.getMyPredictions(page)
    }
}
