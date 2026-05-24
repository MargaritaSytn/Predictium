import api from "../api/api";
import { Prediction, PaginatedResponse } from "../types";

interface PlacePredictionData {
  event: number;
  selected_outcome: number;
  amount_tokens: number;
}

export const predictionService = {
  placePrediction: (data: PlacePredictionData) => api.post<Prediction>("/predictions/", data),
  getMyPredictions: (params?: { page?: number }) => api.get<PaginatedResponse<Prediction>>("/predictions/my/", { params }),
};
