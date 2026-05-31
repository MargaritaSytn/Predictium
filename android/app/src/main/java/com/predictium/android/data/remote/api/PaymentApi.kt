package com.predictium.android.data.remote.api

import com.predictium.android.data.remote.dto.*
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Query

interface PaymentApi {

    @POST("payments/purchase/")
    suspend fun purchaseTokens(@Body request: PurchaseRequest): PurchaseResponse

    @POST("payments/purchase/execute/")
    suspend fun executePurchase(@Body request: ExecutePurchaseRequest): Map<String, String>

    @POST("payments/premium/")
    suspend fun purchasePremium(): PurchaseResponse

    @POST("payments/premium/execute/")
    suspend fun executePremium(@Body request: ExecutePurchaseRequest): Map<String, String>

    @POST("payments/withdraw/")
    suspend fun withdraw(@Body request: WithdrawRequest): WithdrawResponse

    @GET("payments/transactions/")
    suspend fun getTransactions(
        @Query("page") page: Int = 1,
        @Query("type") type: String? = null
    ): PaginatedResponse<Transaction>
}
