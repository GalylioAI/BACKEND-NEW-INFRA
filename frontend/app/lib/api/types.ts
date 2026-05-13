export interface ApiMeta {
  request_id: string;
  timestamp: string;
}

export interface ApiEnvelope<T> {
  success: true;
  data: T;
  meta: ApiMeta;
}

export interface ApiFailureEnvelope {
  success: false;
  error: ApiErrorBody;
  meta: ApiMeta;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  fields?: Record<string, string>;
  retry_after_seconds?: number;
}

export interface Pagination {
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface PaginatedItems<T> {
  items: T[];
  pagination: Pagination;
}

export type UserRole = "user" | "admin" | "superadmin";

export interface UserResponse {
  id: string;
  _id?: string;
  full_name: string;
  username: string;
  email: string;
  phone?: string | null;
  gouvernorat_id?: number | null;
  role: UserRole;
  auth_provider: "manual" | "google" | string;
  is_verified: boolean;
  is_banned: boolean;
  ban_reason?: string | null;
  two_factor_enabled: boolean;
  two_factor_enabled_at?: string | null;
  last_login_at?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  birthdate?: string | null;
  address?: string | null;
  picture?: string | null;
}

export interface SignupRequest {
  full_name: string;
  username: string;
  email: string;
  phone: string;
  password: string;
  gouvernorat_id: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token?: string;
  access_token_expires_at?: string;
  expires_at?: string;
  two_factor_required?: boolean;
  two_factor_session_token?: string;
}

export interface AccessTokenResponse {
  access_token: string;
  access_token_expires_at?: string;
  expires_at?: string;
}

export interface Gouvernorat {
  id: number;
  name: string;
}

export interface Favorite {
  id: string;
  product_id: string;
  created_at: string;
}

export interface FavoriteCheck {
  is_favorited: boolean;
}

export interface PopularFavorite {
  product_id: string;
  favorite_count: number;
}

export type AlertType =
  | "price_drop"
  | "price_above"
  | "back_in_stock"
  | "discount";

export interface Alert {
  id: string;
  product_id: string;
  type: AlertType;
  threshold?: number | null;
  is_active: boolean;
  triggered_at?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface AlertRequest {
  product_id: string;
  type: AlertType;
  threshold?: number | null;
}

export interface AlertUpdateRequest {
  type: AlertType;
  threshold?: number | null;
}

export interface MessageResponse {
  message: string;
}

export interface PasswordResetVerifyResponse {
  reset_token: string;
}

export function normalizeUser(user: UserResponse): UserResponse {
  return { ...user, _id: user._id || user.id };
}
