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

export interface TopPredictor {
  id: number;
  username: string;
  success_rate: number;
}

export interface Prediction {
  id: number;
  event: number;
  event_title: string;
  selected_outcome: number;
  outcome_label: string;
  amount_tokens: number;
  locked_coefficient: number;
  prediction_status: string;
  payout_amount: number;
  probability_at_creation: number;
  created_at: string;
}

export interface Transaction {
  id: number;
  type: string;
  amount: number;
  currency_equivalent: number;
  status: string;
  description: string;
  created_at: string;
  confirmed_at?: string;
}

export interface Review {
  id: number;
  username: string;
  rating: number;
  comment_text: string;
  created_at: string;
  is_approved: boolean;
}

export interface PublicUser {
  id: number;
  username: string;
  registration_date: string;
  premium_status: boolean;
  bio: string;
  success_rate: number;
  total_predictions: number;
  won_predictions: number;
  followers_count: number;
  following_count: number;
  is_following: boolean;
}

export interface Report {
  id: number;
  reporter_username: string;
  reported_user: number | null;
  reported_username: string | null;
  reported_review: number | null;
  reason: string;
  description: string;
  status: string;
  created_at: string;
}

export interface HintResponse {
  hint_text: string;
  hints_used_today: number;
  hints_remaining: number;
}

export interface HintStatus {
  hints_used_today: number;
  hints_remaining: number;
  daily_limit: number;
}
