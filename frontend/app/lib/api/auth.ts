import { apiFetch } from "./client";
import type {
  ChangePasswordPayload,
  LoginResponse,
  UserCreate,
  UserLogin,
  UserProfileUpdate,
  UserResponse,
} from "./types";

export function signupUser(payload: UserCreate) {
  return apiFetch<{ user_id: string; email: string }>("/users/signup", {
    method: "POST",
    body: payload,
  });
}

export function signinUser(payload: UserLogin) {
  return apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: payload,
  });
}

export function getCurrentUser(token: string) {
  return apiFetch<UserResponse>("/users/me", {
    token,
    cache: "no-store",
  });
}

export function updateProfile(token: string, payload: UserProfileUpdate) {
  return apiFetch<UserResponse>("/users/me", {
    method: "PUT",
    token,
    body: payload,
  });
}

export function changePassword(token: string, payload: ChangePasswordPayload) {
  return apiFetch<{ message?: string }>("/users/me/password", {
    method: "PUT",
    token,
    body: payload,
  });
}

export function deleteAccount(token: string) {
  return apiFetch<{ message?: string }>("/users/me", {
    method: "DELETE",
    token,
  });
}

// Password reset — 3-step flow
export function requestPasswordReset(email: string) {
  return apiFetch<{ message?: string }>("/otp/password-reset/send", {
    method: "POST",
    body: { email },
  });
}

export function verifyPasswordResetCode(email: string, code: string) {
  return apiFetch<{ reset_token: string }>("/otp/password-reset/verify", {
    method: "POST",
    body: { email, code },
  });
}

export function applyPasswordReset(
  reset_token: string,
  new_password: string,
  new_password_confirm: string,
) {
  return apiFetch<{ message?: string }>("/otp/password-reset/apply", {
    method: "POST",
    body: { reset_token, new_password, new_password_confirm },
  });
}

// Email verification
export function sendEmailVerification(token: string) {
  return apiFetch<{ message?: string }>("/otp/email/send", {
    method: "POST",
    token,
  });
}

export function verifyEmail(token: string, code: string) {
  return apiFetch<{ is_verified: boolean }>("/otp/email/verify", {
    method: "POST",
    token,
    body: { code },
  });
}

// Token management
export function refreshToken() {
  return apiFetch<{ access_token: string }>("/auth/refresh", {
    method: "POST",
    credentials: "include", // relies on HttpOnly refresh_token cookie
  });
}

export function logoutUser(token: string) {
  return apiFetch<{ message?: string }>("/auth/logout", {
    method: "POST",
    token,
  });
}

export function logoutAllSessions(token: string) {
  return apiFetch<{ message?: string }>("/auth/logout-all", {
    method: "POST",
    token,
  });
}

// Gouvernorats (required for signup region picker)
export function getGouvernorats() {
  return apiFetch<Array<{ id: number; name: string }>>("/gouvernorats");
}
