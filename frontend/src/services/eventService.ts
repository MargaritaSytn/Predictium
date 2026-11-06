import api from "../api/api";
import { Event, PaginatedResponse } from "../types";

interface EventParams {
  category?: string;
  status?: string;
  page?: number;
}

interface TopEventsResponse {
  most_popular: Event[];
  most_discussed: Event[];
  most_predicted: Event[];
}

export const eventService = {
  getEvents: (params?: EventParams) => api.get<PaginatedResponse<Event>>("/events/", { params }),
  getEvent: (id: string | number) => api.get<Event>(`/events/${id}/`),
  getTopEvents: () => api.get<TopEventsResponse>("/events/top/"),
};
