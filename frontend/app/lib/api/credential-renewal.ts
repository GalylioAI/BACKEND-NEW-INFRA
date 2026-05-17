import { apiUrl } from "./config";
import { endpoints } from "./endpoints";
import {
  clearAccessToken,
  clearSessionMarker,
  markSessionPresent,
  setAccessToken,
} from "./token-store";
import type { ApiFailureEnvelope, SessionResponse, UserResponse } from "./types";
import { normalizeUser } from "./types";

export type RenewedSession = {
  access_token: string;
  access_token_expires_at?: string;
  user: UserResponse;
};

let renewalPromise: Promise<RenewedSession | null> | null = null;

class SessionRenewalError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "SessionRenewalError";
    this.status = status;
    this.code = code;
  }
}

async function parseSessionResponse(response: Response): Promise<SessionResponse> {
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
    throw new SessionRenewalError(
      response.status,
      apiError?.code || `HTTP_${response.status}`,
      apiError?.message || response.statusText || "Session renewal failed.",
    );
  }

  if (body && typeof body === "object" && "success" in body) {
    return (body as unknown as { data: SessionResponse }).data;
  }

  return body as SessionResponse;
}

async function fetchSession(): Promise<RenewedSession> {
  const response = await fetch(apiUrl(endpoints.auth.session), {
    method: "POST",
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  const data = await parseSessionResponse(response);
  return {
    access_token: data.access_token,
    access_token_expires_at: data.access_token_expires_at,
    user: normalizeUser(data.user),
  };
}

export function renewCredentials(): Promise<RenewedSession | null> {
  if (!renewalPromise) {
    renewalPromise = (async () => {
      try {
        const session = await fetchSession();
        setAccessToken(session.access_token, {
          expiresAt: session.access_token_expires_at,
        });
        markSessionPresent();
        return session;
      } catch {
        clearAccessToken();
        clearSessionMarker();
        return null;
      } finally {
        renewalPromise = null;
      }
    })();
  }
  return renewalPromise;
}

/** Test-only: reset in-flight renewal lock. */
export function __resetRenewalForTests() {
  renewalPromise = null;
}
