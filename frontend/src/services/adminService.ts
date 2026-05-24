import api from "../api/api";
import { AdminUser, PaginatedResponse, PlatformStats, Event, CreateEventPayload, EventOutcome } from "../types";

export const adminService = {
  // Stats
  getStats: () => api.get<PlatformStats>("/auth/admin/stats/"),

  // Users
  getUsers: (page = 1) => api.get<PaginatedResponse<AdminUser>>("/auth/admin/users/", { params: { page } }),
  getUser: (id: number) => api.get<AdminUser>(`/auth/admin/users/${id}/`),

  // Events
  getEvents: (page = 1) => api.get<PaginatedResponse<Event>>("/events/admin/", { params: { page } }),
  createEvent: (payload: CreateEventPayload) => api.post<Event>("/events/admin/", payload),
  updateEvent: (id: number, payload: Partial<CreateEventPayload>) =>
    api.patch<Event>(`/events/admin/${id}/`, payload),
  deleteEvent: (id: number) => api.delete(`/events/admin/${id}/`),

  // Outcomes
  addOutcome: (eventId: number, label: string) =>
    api.post<EventOutcome>(`/events/admin/${eventId}/outcomes/`, { label }),
  deleteOutcome: (outcomeId: number) => api.delete(`/events/admin/outcomes/${outcomeId}/`),
};
