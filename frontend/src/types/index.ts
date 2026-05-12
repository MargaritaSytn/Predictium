export interface User {
  id: number;
  username: string;
  email: string;
  token_balance: number;
  premium_status: boolean;
  is_staff: boolean;
  registration_date: string;
  bio: string;
  success_rate: number;
  won_predictions: number;
  total_predictions: number;
  wallet_balance: number;
}

export interface EventOutcome {
  id: number;
  label: string;
  total_tokens_wagered: number;
  current_coefficient: number;
}

export interface Event {
  id: number;
  title: string;
  description: string;
  category: string;
  image_url?: string;
  deadline: string;
  status: string;
  created_at: string;
  updated_at?: string;
  result?: string;
  outcomes?: EventOutcome[];
  prediction_count?: number;
  review_count?: number;
  total_tokens_wagered?: number;
}

export interface AuthResponse {
  user: User;
  access: string;
  refresh: string;
  daily_bonus_granted?: boolean;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
