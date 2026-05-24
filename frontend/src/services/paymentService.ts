import api from "../api/api";
import { PaginatedResponse, Transaction } from "../types";

interface PurchaseResponse {
  approval_url: string;
  payment_id: string;
}

interface ExecuteData {
  payment_id: string;
  payer_id: string;
}

interface WithdrawResponse {
  detail: string;
  tokens_withdrawn: number;
  fee_tokens: number;
  net_usd: number;
}

export const paymentService = {
  purchaseTokens: (token_amount: number) =>
    api.post<PurchaseResponse>("/payments/purchase/", { token_amount }),

  executePurchase: (data: ExecuteData) =>
    api.post<{ detail: string }>("/payments/purchase/execute/", data),

  purchasePremium: () =>
    api.post<PurchaseResponse>("/payments/premium/"),

  executePremium: (data: ExecuteData) =>
    api.post<{ detail: string }>("/payments/premium/execute/", data),

  withdraw: (token_amount: number) =>
    api.post<WithdrawResponse>("/payments/withdraw/", { token_amount }),

  getTransactions: (params?: { type?: string; page?: number }) =>
    api.get<PaginatedResponse<Transaction>>("/payments/transactions/", { params }),
};
