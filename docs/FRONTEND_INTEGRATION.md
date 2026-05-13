# Frontend Integration Guide

This backend is designed for a browser frontend that talks only to the API Gateway.

## Base Configuration

```ts
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";
```

In production, set `VITE_API_BASE_URL` to your API domain, for example `https://api.example.com`.

For interactive testing, open the backend Swagger UI:

```text
https://backend.1111.tn/docs
```

Click **Authorize**, paste the access token as `Bearer <token>`, then use "Try it out" on protected endpoints.

The backend CORS config must include the frontend origin exactly:

```env
CORS_ALLOWED_ORIGINS=https://app.example.com,http://localhost:3000
```

No wildcard origins are allowed in production.

## HTTP Client Setup

Use `credentials: "include"` for every request that should send or receive the refresh cookie.

```ts
type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    fields?: Record<string, string>;
    retry_after_seconds?: number;
  };
  meta?: {
    request_id: string;
    timestamp: string;
  };
};

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

type ApiFetchOptions = RequestInit & { authToken?: string | null };

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<ApiResponse<T>> {
  const { authToken, ...fetchOptions } = options;
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  } else if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...fetchOptions,
    headers,
    credentials: "include",
  });

  const body = (await response.json().catch(() => null)) as ApiResponse<T> | null;
  if (!body) {
    return {
      success: false,
      error: { code: "BAD_RESPONSE", message: "Unexpected server response." },
    };
  }

  return body;
}
```

## Token Lifecycle

Access token expiry is configured by `JWT_ACCESS_EXPIRY`. Refresh tokens are opaque, live in an HttpOnly cookie, and are rotated by `POST /auth/refresh`. Refreshed access tokens preserve the original login `auth_time` and `amr`, so refresh does not extend recent-auth freshness.

Recommended frontend behavior:

1. Store the access token in memory, not localStorage.
2. On page load, call `/auth/refresh` once to restore a session if the refresh cookie exists.
3. On any `401 TOKEN_EXPIRED`, call `/auth/refresh`, update the access token, and retry the original request once.
4. On refresh failure, clear the in-memory token and show the login screen.

```ts
export async function refreshSession() {
  const res = await apiFetch<{ access_token: string }>("/auth/refresh", {
    method: "POST",
  });
  if (res.success && res.data?.access_token) {
    setAccessToken(res.data.access_token);
    return true;
  }
  setAccessToken(null);
  return false;
}
```

## Signup And Email Verification

Flow:

1. `POST /users/signup`
2. Backend publishes `user.created`
3. OTP service sends an email verification code through Mail Service
4. User submits the code to `POST /otp/email/verify`
5. User can now log in

Example signup:

```ts
await apiFetch("/users/signup", {
  method: "POST",
  body: JSON.stringify({
    full_name: "Jane Doe",
    username: "janedoe",
    email: "jane@example.com",
    phone: "+21612345678",
    password: "Strong$123",
    gouvernorat_id: 1,
  }),
});
```

Email verification requires the user to be authenticated. In most UIs, show login after signup. If login returns `ACCOUNT_NOT_VERIFIED`, let the user request another code with `POST /otp/email/send` after they authenticate or design a verification screen around the existing backend flow.

## Login Flow

```ts
const res = await apiFetch<{
  access_token?: string;
  two_factor_required?: boolean;
  two_factor_session_token?: string;
}>(
  "/auth/login",
  {
    method: "POST",
    body: JSON.stringify({
      identifier: "jane@example.com",
      password: "Strong$123",
    }),
  },
);

if (res.success && res.data?.access_token) {
  setAccessToken(res.data.access_token);
}

if (res.success && res.data?.two_factor_required) {
  // Store the returned pending token in component state and show OTP input.
  const pendingToken = res.data.two_factor_session_token!;
}
```

Treat the pending token as short-lived sensitive state and keep it in memory.

## 2FA Login Completion

```ts
const res = await apiFetch<{ access_token: string }>("/otp/2fa/login/verify", {
  method: "POST",
  authToken: pendingToken,
  body: JSON.stringify({
    code,
  }),
});

if (res.success) {
  setAccessToken(res.data!.access_token);
}
```

## 2FA Settings

Enablement is a two-step flow. Start with the normal access token and current password:

```ts
await apiFetch("/otp/2fa/enable", {
  method: "POST",
  body: JSON.stringify({ password: currentPassword }),
});
```

Then confirm with the OTP:

```ts
await apiFetch("/otp/2fa/enable/verify", {
  method: "POST",
  body: JSON.stringify({ code }),
});
```

Disablement is also two-step. Start with a local password:

```ts
await apiFetch("/otp/2fa/disable", {
  method: "POST",
  body: JSON.stringify({ current_password: currentPassword }),
});
```

Then confirm with the OTP:

```ts
await apiFetch("/otp/2fa/disable/verify", {
  method: "POST",
  body: JSON.stringify({ code }),
});
```

OAuth-only users without a local password receive `LOCAL_PASSWORD_REQUIRED`. They must set a local password first:

```ts
await apiFetch("/users/me/password/set", {
  method: "POST",
  body: JSON.stringify({
    new_password: newPassword,
    new_password_confirm: newPasswordConfirm,
  }),
});
```

If the account has 2FA enabled, call password set only after a recent 2FA-completed login. Password set keeps the current session active and revokes other refresh sessions.

## Logout

```ts
await apiFetch("/auth/logout", { method: "POST", authToken: getAccessTokenOrNull() });
setAccessToken(null);
```

`POST /auth/logout` still clears the refresh cookie if the access token is missing
or expired. For "logout everywhere", call `POST /auth/logout-all` with a valid
access token.

## Profile

Fetch current user:

```ts
const me = await apiFetch<UserProfile>("/users/me");
```

Partial update:

```ts
await apiFetch("/users/me", {
  method: "PUT",
  body: JSON.stringify({
    full_name: "Jane A. Doe",
    username: "janeadoe",
    phone: "+21612345678",
    gouvernorat_id: 2,
  }),
});
```

## Favorites UI

Optimistic favorite toggle pattern:

1. Check initial state with `GET /favorites/{product_id}`.
2. If false, call `POST /favorites`.
3. If true, call `DELETE /favorites/{product_id}`.
4. If `ALREADY_FAVORITED`, refresh local state and show it as favorited.

The backend does not validate product existence yet; the future Product Service will own that.

## Alerts UI

For alert creation forms:

- Show threshold field only for `price_drop` and `price_above`.
- Hide or clear threshold for `back_in_stock` and `discount`.
- Send `type` as one of the backend enum values exactly.

```ts
await apiFetch("/alerts", {
  method: "POST",
  body: JSON.stringify({
    product_id,
    type: "price_drop",
    threshold: 49.99,
  }),
});
```

Use `GET /alerts?is_active=true&type=price_drop` for filtered lists.

## Error Handling

Always branch on `error.code`, not message text. Messages are user-facing but may change.

Common frontend mappings:

- `VALIDATION_ERROR`: render field-level messages from `error.fields`
- `INVALID_CREDENTIALS`: show generic login error
- `ACCOUNT_NOT_VERIFIED`: show email verification CTA
- `ACCOUNT_BANNED`: block login and show support copy
- `two_factor_required`: show 2FA OTP screen using `two_factor_session_token`
- `TOKEN_EXPIRED`: refresh and retry once
- `RATE_LIMIT_EXCEEDED`: disable submit until `Retry-After` or `retry_after_seconds`
- `ALREADY_FAVORITED`: treat favorite state as true
- `DUPLICATE_ALERT`: show existing-alert message

## Do Not Do This

- Do not call services on ports `8081`-`8085` from the frontend.
- Do not send `X-User-Id`, `X-User-Role`, `X-User-Email`, or `X-Internal-Secret`.
- Do not store refresh tokens in JavaScript.
- Do not store access tokens in localStorage unless you consciously accept the XSS persistence risk.
- Do not parse JWTs for authorization decisions in the frontend; use them only as bearer credentials.
