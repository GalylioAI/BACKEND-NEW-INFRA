import { apiUrl } from "./config";
import { endpoints } from "./endpoints";
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from "./token-store";
import type { AccessTokenResponse, ApiFailureEnvelope, ApiMeta } from "./types";

type QueryValue = string | number | boolean | null | undefined;

interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  auth?: boolean;
  body?: unknown;
  query?: Record<string, QueryValue>;
  retryOnAuthFailure?: boolean;
}

export class ApiError extends Error {
  status: number;
  code: string;
  fields?: Record<string, string>;
  retryAfterSeconds?: number;
  requestId?: string;

  constructor(
    status: number,
    code: string,
    message: string,
    options: {
      fields?: Record<string, string>;
      retryAfterSeconds?: number;
      requestId?: string;
    } = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fields = options.fields;
    this.retryAfterSeconds = options.retryAfterSeconds;
    this.requestId = options.requestId;
  }
}

let refreshPromise: Promise<string | null> | null = null;
let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

export function getApiErrorMessage(
  error: unknown,
  fallback = "Une erreur est survenue.",
) {
  if (error instanceof ApiError) {
    return error.message || fallback;
  }
  if (error instanceof Error) {
    return error.message || fallback;
  }
  return fallback;
}

export function getApiErrorCode(error: unknown) {
  return error instanceof ApiError ? error.code : "";
}

export function getApiErrorRequestId(error: unknown) {
  return error instanceof ApiError ? error.requestId : undefined;
}

export function getApiErrorFields(error: unknown) {
  return error instanceof ApiError && error.fields ? error.fields : {};
}

const fieldMessageMap: Record<string, Record<string, string>> = {
  email: {
    EMAIL_ALREADY_REGISTERED:
      "Un compte existe deja avec cet email. Connectez-vous avec le mot de passe.",
    CONFLICT: "Cette adresse email est deja utilisee.",
  },
  phone: {
    CONFLICT: "Ce numero de telephone est deja utilise.",
  },
  username: {
    CONFLICT: "Ce nom d'utilisateur est deja utilise.",
  },
};

function fallbackFieldMessage(field: string, raw: string, code: string) {
  const lower = raw.toLowerCase();
  if (field === "email") {
    if (code === "EMAIL_ALREADY_REGISTERED" || lower.includes("password")) {
      return "Un compte existe deja avec cet email. Connectez-vous avec le mot de passe.";
    }
    if (lower.includes("already") || lower.includes("use")) {
      return "Cette adresse email est deja utilisee.";
    }
    return "Verifiez cette adresse email.";
  }
  if (field === "phone") {
    if (lower.includes("already") || lower.includes("use")) {
      return "Ce numero de telephone est deja utilise.";
    }
    return "Verifiez ce numero de telephone.";
  }
  if (field === "username") {
    if (lower.includes("already") || lower.includes("use")) {
      return "Ce nom d'utilisateur est deja utilise.";
    }
    return "Verifiez ce nom d'utilisateur.";
  }
  if (field === "password" || field.includes("password")) {
    return "Verifiez le mot de passe.";
  }
  if (field === "code") {
    return "Le code doit contenir 6 chiffres.";
  }
  return raw || "Verifiez ce champ.";
}

export function getApiFieldErrors(error: unknown) {
  if (!(error instanceof ApiError) || !error.fields) {
    return {} as Record<string, string>;
  }
  return Object.fromEntries(
    Object.entries(error.fields).map(([field, message]) => [
      field,
      fieldMessageMap[field]?.[error.code] ||
        fallbackFieldMessage(field, message, error.code),
    ]),
  );
}

export function getApiFieldMessage(
  error: unknown,
  field: string,
  fallback = "",
) {
  return getApiFieldErrors(error)[field] || fallback;
}

export function getFrenchApiErrorMessage(
  error: unknown,
  fallback = "Une erreur est survenue.",
) {
  if (!(error instanceof ApiError)) {
    return getApiErrorMessage(error, fallback);
  }

  if (error.code === "EMAIL_ALREADY_REGISTERED") {
    return "Un compte existe deja avec cet email. Connectez-vous avec le mot de passe.";
  }
  if (error.code === "USE_GOOGLE_LOGIN") {
    return "Ce compte utilise Google. Connectez-vous avec Google.";
  }
  if (error.code === "INVALID_CREDENTIALS") {
    return "Email ou mot de passe incorrect.";
  }
  if (error.code === "ACCOUNT_NOT_VERIFIED") {
    return "Votre email n'est pas encore verifie.";
  }
  if (error.code === "ACCOUNT_BANNED") {
    return "Ce compte est bloque.";
  }
  if (error.code === "DUPLICATE_ALERT") {
    return "Vous avez deja une alerte active pour ce produit.";
  }
  if (error.code === "ALREADY_FAVORITED") {
    return "Ce produit est deja dans vos favoris.";
  }
  if (error.status === 422) {
    return "Verifiez les champs saisis.";
  }
  if (error.status === 429) {
    const retry = error.retryAfterSeconds
      ? ` Reessayez dans ${error.retryAfterSeconds} seconde${
          error.retryAfterSeconds > 1 ? "s" : ""
        }.`
      : "";
    return `Trop de tentatives.${retry}`;
  }

  return getApiErrorMessage(error, fallback);
}

function withQuery(path: string, query?: Record<string, QueryValue>) {
  if (!query) return path;
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    params.set(key, String(value));
  });
  const suffix = params.toString();
  if (!suffix) return path;
  return `${path}${path.includes("?") ? "&" : "?"}${suffix}`;
}

async function parseResponse<T>(response: Response): Promise<{
  data: T;
  meta?: ApiMeta;
}> {
  const text = await response.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
  }

  if (!response.ok) {
    const failure = body as ApiFailureEnvelope | null;
    const apiError = failure?.success === false ? failure.error : null;
    throw new ApiError(
      response.status,
      apiError?.code || `HTTP_${response.status}`,
      apiError?.message || response.statusText || "Request failed.",
      {
        fields: apiError?.fields,
        retryAfterSeconds: apiError?.retry_after_seconds,
        requestId: failure?.meta?.request_id,
      },
    );
  }

  if (body && typeof body === "object" && "success" in body) {
    return {
      data: (body as unknown as { data: T }).data,
      meta: (body as { meta?: ApiMeta }).meta,
    };
  }

  return { data: body as T };
}

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const response = await fetch(apiUrl(endpoints.auth.refresh), {
          method: "POST",
          credentials: "include",
          headers: { Accept: "application/json" },
        });
        const { data } = await parseResponse<AccessTokenResponse>(response);
        setAccessToken(data.access_token);
        return data.access_token;
      } catch {
        clearAccessToken();
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const {
    auth = false,
    body,
    query,
    retryOnAuthFailure = true,
    headers,
    ...init
  } = options;
  const token = getAccessToken();
  const requestHeaders = new Headers(headers);

  requestHeaders.set("Accept", "application/json");
  if (body !== undefined && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }
  if (auth && token) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(apiUrl(withQuery(path, query)), {
    ...init,
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: "include",
    headers: requestHeaders,
  });

  try {
    const { data } = await parseResponse<T>(response);
    return data;
  } catch (error) {
    if (
      auth &&
      retryOnAuthFailure &&
      error instanceof ApiError &&
      error.status === 401
    ) {
      const refreshedToken = await refreshAccessToken();
      if (refreshedToken) {
        return apiRequest<T>(path, {
          ...options,
          retryOnAuthFailure: false,
        });
      }
      unauthorizedHandler?.();
    }
    throw error;
  }
}

export async function primeSessionFromRefresh() {
  return refreshAccessToken();
}
