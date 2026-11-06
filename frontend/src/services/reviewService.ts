import api from "../api/api";
import { Review } from "../types";

export const reviewService = {
  getEventReviews: (eventId: number | string) =>
    api.get<Review[]>(`/events/${eventId}/reviews/`),

  createReview: (eventId: number | string, data: { rating: number; comment_text: string }) =>
    api.post<Review>(`/events/${eventId}/reviews/create/`, data),

  getPendingReviews: () =>
    api.get<Review[]>("/events/moderation/reviews/"),

  approveReview: (reviewId: number) =>
    api.post<Review>(`/events/moderation/reviews/${reviewId}/approve/`),

  rejectReview: (reviewId: number) =>
    api.post(`/events/moderation/reviews/${reviewId}/reject/`),
};
