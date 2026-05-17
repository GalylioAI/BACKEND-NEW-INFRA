import { apiRequest } from "./client";
import { renewCredentials } from "./credential-renewal";
import { endpoints } from "./endpoints";
import {
  clearAccessToken,
  clearSessionMarker,
  getAccessToken,
  markSessionPresent,
  setAccessToken,
} from "./token-store";
import type {
  AccessTokenResponse,
  LoginRequest,
  LoginResponse,
  MessageResponse,
  UserResponse,
} from "./types";
import { normalizeUser } from "./types";

export async function login(payload: LoginRequest) {
  const result = await apiRequest<LoginResponse>(endpoints.auth.login, {
    method: "POST",
    body: { identifier: payload.email, password: payload.password },
  });

  if (result.access_token) {
    setAccessToken(result.access_token, {
      expiresAt: result.access_token_expires_at,
    });
    markSessionPresent();
  }

  return result;
}

export async function googleLogin(idToken: string) {
  const result = await apiRequest<LoginResponse>(endpoints.auth.google, {
    method: "POST",
    body: { id_token: idToken },
  });

  if (result.access_token) {
    setAccessToken(result.access_token, {
      expiresAt: result.access_token_expires_at,
    });
    markSessionPresent();
  }

  return result;
}

export async function verifyLogin2FA(code: string, pendingToken: string) {
  const result = await apiRequest<AccessTokenResponse>(
    endpoints.otp.login2faVerify,
    {
      method: "POST",
      body: { code },
      headers: { Authorization: `Bearer ${pendingToken}` },
    },
  );
  setAccessToken(result.access_token, {
    expiresAt: result.access_token_expires_at,
  });
  markSessionPresent();
  return result;
}

export async function refreshSession() {
  const renewed = await renewCredentials();
  return renewed?.access_token ?? null;
}

export async function session() {
  const renewed = await renewCredentials();
  if (!renewed) {
    clearAccessToken();
    clearSessionMarker();
    throw new Error("Session could not be restored.");
  }
  return renewed;
}

export async function currentUser() {
  const user = await apiRequest<UserResponse>(endpoints.users.me, {
    method: "GET",
    auth: true,
  });
  return normalizeUser(user);
}

export async function logout() {
  const token = getAccessToken();
  try {
    await apiRequest<MessageResponse>(endpoints.auth.logout, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      retryOnAuthFailure: false,
    });
  } finally {
    clearAccessToken();
    clearSessionMarker();
  }
}

export async function logoutAll() {
  try {
    await apiRequest<MessageResponse>(endpoints.auth.logoutAll, {
      method: "POST",
      auth: true,
    });
  } finally {
    clearAccessToken();
    clearSessionMarker();
  }
}

export function clearAuthToken() {
  clearAccessToken();
  clearSessionMarker();
}
