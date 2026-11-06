import api from "../api/api";
import { PublicUser, PaginatedResponse } from "../types";

export const socialService = {
  getPublicProfile: (userId: number | string) =>
    api.get<PublicUser>(`/auth/users/${userId}/`),

  followUser: (userId: number | string) =>
    api.post(`/auth/users/${userId}/follow/`),

  unfollowUser: (userId: number | string) =>
    api.delete(`/auth/users/${userId}/follow/`),

  getFollowers: (userId: number | string) =>
    api.get<PaginatedResponse<PublicUser>>(`/auth/users/${userId}/followers/`),

  getFollowing: (userId: number | string) =>
    api.get<PaginatedResponse<PublicUser>>(`/auth/users/${userId}/following/`),

  createReport: (data: { reported_user?: number; reported_review?: number; reason: string; description?: string }) =>
    api.post("/auth/reports/", data),
};
