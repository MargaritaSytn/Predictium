import api from "../api/api";
import { AuthResponse, TopPredictor, User } from "../types";

interface RegisterData {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
}

export const authService = {
  login: (email: string, password: string) => api.post<AuthResponse>("/auth/login/", { email, password }),
  register: (data: RegisterData) => api.post<AuthResponse>("/auth/register/", data),
  getProfile: () => api.get<User>("/auth/profile/"),
  refreshToken: (refresh: string) => api.post<{ access: string }>("/auth/token/refresh/", { refresh }),
  getTopPredictors: () => api.get<TopPredictor[]>("/auth/top-predictors/"),
};
