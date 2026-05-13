const DEFAULT_DEV_API_BASE_URL = "http://localhost:8080";
const PRODUCTION_API_BASE_URL = "https://backend.1111.tn";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

export const API_BASE_URL = trimTrailingSlash(
  process.env.NEXT_PUBLIC_API_BASE_URL ||
    (process.env.NODE_ENV === "production"
      ? PRODUCTION_API_BASE_URL
      : DEFAULT_DEV_API_BASE_URL),
);

export const APP_URL = trimTrailingSlash(
  process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://1111.tn"
      : "http://localhost:3000"),
);

export function apiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}
