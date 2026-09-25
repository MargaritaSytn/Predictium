import api from "../api/api";
import { Notification, PaginatedResponse, UnreadCount } from "../types";

export const notificationService = {
  getNotifications: (page = 1) =>
    api.get<PaginatedResponse<Notification>>(`/notifications/?page=${page}`),

  getUnreadCount: () =>
    api.get<UnreadCount>("/notifications/unread-count/"),

  markRead: (id: number) =>
    api.post<Notification>(`/notifications/${id}/read/`),

  markAllRead: () =>
    api.post("/notifications/read-all/"),
};
