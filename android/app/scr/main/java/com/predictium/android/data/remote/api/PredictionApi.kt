package com.predictium.android.data.remote.api

import com.predictium.android.data.remote.dto.PaginatedResponse
import com.predictium.android.data.remote.dto.PlacePredictionRequest
import com.predictium.android.data.remote.dto.Prediction
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Query

interface PredictionApi {

    @POST("predictions/")
    suspend fun placePrediction(@Body request: PlacePredictionRequest): Prediction

    @GET("predictions/my/")
    suspend fun getMyPredictions(@Query("page") page: Int = 1): PaginatedResponse<Prediction>
}
