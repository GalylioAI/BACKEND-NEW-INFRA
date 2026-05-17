let accessToken: string | null = null;
let accessTokenExpiresAtMs: number | null = null;
const SESSION_MARKER_KEY = "1111:refresh-session";

export const ACCESS_TOKEN_REFRESH_BUFFER_SEC = 60;

function browserStorage() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function decodeJwtExpiryMs(token: string): number | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );
    const payload = JSON.parse(atob(padded)) as { exp?: number };
    if (typeof payload.exp !== "number") return null;
    return payload.exp * 1000;
  } catch {
    return null;
  }
}

export function getAccessToken() {
  return accessToken;
}

export function getAccessTokenExpiresAtMs() {
  return accessTokenExpiresAtMs;
}

export function setAccessToken(
  token: string | null,
  options?: { expiresAt?: string | number },
) {
  accessToken = token;
  if (!token) {
    accessTokenExpiresAtMs = null;
    return;
  }
  if (options?.expiresAt !== undefined) {
    accessTokenExpiresAtMs =
      typeof options.expiresAt === "string"
        ? Date.parse(options.expiresAt)
        : options.expiresAt;
    if (Number.isNaN(accessTokenExpiresAtMs)) {
      accessTokenExpiresAtMs = decodeJwtExpiryMs(token);
    }
    return;
  }
  accessTokenExpiresAtMs = decodeJwtExpiryMs(token);
}

export function clearAccessToken() {
  accessToken = null;
  accessTokenExpiresAtMs = null;
}

export function isAccessTokenExpiringSoon(
  bufferSec = ACCESS_TOKEN_REFRESH_BUFFER_SEC,
) {
  if (!accessToken) return true;
  if (!accessTokenExpiresAtMs) return false;
  return Date.now() >= accessTokenExpiresAtMs - bufferSec * 1000;
}

export function needsAccessTokenRenewal(
  bufferSec = ACCESS_TOKEN_REFRESH_BUFFER_SEC,
) {
  return !accessToken || isAccessTokenExpiringSoon(bufferSec);
}

export function markSessionPresent() {
  browserStorage()?.setItem(SESSION_MARKER_KEY, "1");
}

export function clearSessionMarker() {
  browserStorage()?.removeItem(SESSION_MARKER_KEY);
}

export function hasSessionMarker() {
  return browserStorage()?.getItem(SESSION_MARKER_KEY) === "1";
}
