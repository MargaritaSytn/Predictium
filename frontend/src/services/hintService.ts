import api from "../api/api";
import { HintResponse, HintStatus } from "../types";

export const hintService = {
  getHint: (eventId: number) =>
    api.post<HintResponse>(`/ai-hints/${eventId}/`),

  getStatus: () =>
    api.get<HintStatus>("/ai-hints/status/"),
};
