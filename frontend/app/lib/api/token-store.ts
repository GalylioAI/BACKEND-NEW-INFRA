let accessToken: string | null = null;
const SESSION_MARKER_KEY = "1111:refresh-session";

function browserStorage() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function clearAccessToken() {
  accessToken = null;
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
