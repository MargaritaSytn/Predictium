import api from "../api/api";
import { PaginatedResponse, Transaction } from "../types";

interface PurchaseResponse {
  transaction_id: number;
  approval_url: string;
  order_id: string;
}

interface ExecuteData {
  order_id: string;
}

interface WithdrawResponse {
  transaction_id: number;
  tokens_withdrawn: number;
  fee_tokens: number;
  net_tokens: number;
  usd_amount: number;
  payout_batch_id: string;
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

  withdraw: (token_amount: number, paypal_email: string) =>
    api.post<WithdrawResponse>("/payments/withdraw/", { token_amount, paypal_email }),

  getTransactions: (params?: { type?: string; page?: number }) =>
    api.get<PaginatedResponse<Transaction>>("/payments/transactions/", { params }),
};
