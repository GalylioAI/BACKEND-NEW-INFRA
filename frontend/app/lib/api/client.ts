import type { ApiValidationIssue } from "./types";

type QueryValue = string | number | boolean | null | undefined;
type QueryParams = Record<string, QueryValue | QueryValue[]>;

// New Go backend — handles auth, users, alerts, favorites, otp
export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://backend.1111.tn"
).replace(/\/$/, "");

// Old backend — handles products, para, analytics, blogs
export const LEGACY_API_BASE_URL = (
  process.env.NEXT_PUBLIC_LEGACY_API_BASE_URL || "https://back-27em.onrender.com"
).replace(/\/$/, "");

const NEW_BACKEND_PREFIXES = ["/auth", "/users", "/alerts", "/favorites", "/otp", "/gouvernorats"];

function resolveBase(path: string): string {
  if (path.startsWith("http")) return "";
  const isNewBackend = NEW_BACKEND_PREFIXES.some((p) => path.startsWith(p));
  return isNewBackend ? API_BASE_URL : LEGACY_API_BASE_URL;
}

interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  query?: QueryParams;
  token?: string | null;
}

export class ApiError extends Error {
  status: number;
  issues: ApiValidationIssue[];
  payload: unknown;

  constructor(message: string, status: number, payload: unknown, issues: ApiValidationIssue[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
    this.issues = issues;
  }
}

function appendQuery(url: URL, query?: QueryParams) {
  if (!query) return;

  Object.entries(query).forEach(([key, value]) => {
    const values = Array.isArray(value) ? value : [value];
    values.forEach((item) => {
      if (item === undefined || item === null || item === "") return;
      url.searchParams.append(key, String(item));
    });
  });
}

function createUrl(path: string, query?: QueryParams) {
  const base = resolveBase(path);
  const url = new URL(path.startsWith("http") ? path : `${base}${path}`);
  appendQuery(url, query);
  return url.toString();
}

function isValidationIssue(value: unknown): value is ApiValidationIssue {
  return (
    typeof value === "object" &&
    value !== null &&
    "msg" in value &&
    typeof (value as { msg?: unknown }).msg === "string"
  );
}

function extractMessage(payload: unknown, fallback: string) {
  if (!payload) return fallback;

  if (typeof payload === "string") return payload;

  if (typeof payload === "object" && payload !== null) {
    const record = payload as Record<string, unknown>;

    // New backend: { success: false, error: { code, message } }
    if (typeof record.error === "object" && record.error !== null) {
      const err = record.error as Record<string, unknown>;
      if (typeof err.message === "string") return err.message;
    }

    const detail = record.detail;
    if (typeof record.message === "string") return record.message;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      const first = detail.find(isValidationIssue);
      if (first) return first.msg;
    }
  }

  return fallback;
}

function extractIssues(payload: unknown) {
  if (typeof payload !== "object" || payload === null) return [];
  const detail = (payload as Record<string, unknown>).detail;
  if (!Array.isArray(detail)) return [];
  return detail.filter(isValidationIssue);
}

// Unwrap new backend envelope: { success, data, meta } → data
function unwrapEnvelope<T>(payload: unknown): T {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "success" in payload &&
    "data" in payload
  ) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

export function getApiErrorMessage(error: unknown, fallback = "Une erreur est survenue.") {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { body, query, token, headers: customHeaders, ...init } = options;
  const headers = new Headers(customHeaders);
  const hasBody = body !== undefined;

  if (hasBody && !(body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(createUrl(path, query), {
    ...init,
    headers,
    body: hasBody ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    throw new ApiError(
      extractMessage(payload, `Erreur API (${response.status})`),
      response.status,
      payload,
      extractIssues(payload),
    );
  }

  return unwrapEnvelope<T>(payload);
}
