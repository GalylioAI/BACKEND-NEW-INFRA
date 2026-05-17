# 1111.tn Frontend

Next.js production frontend for `https://1111.tn`.

## Environment

Local development:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<google-oauth-web-client-id>
```

Production:

```env
NEXT_PUBLIC_API_BASE_URL=https://backend.1111.tn
NEXT_PUBLIC_APP_URL=https://1111.tn
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<google-oauth-web-client-id>
```

Only public browser-safe values may use `NEXT_PUBLIC_*`. Never put refresh tokens or access tokens in env files.

## Authentication

- **Access token:** held in memory only (`app/lib/api/token-store.ts`). Sent as `Authorization: Bearer <token>` on protected API calls.
- **Refresh token:** HttpOnly cookie on the API host (`backend.1111.tn`), path `/auth`. The frontend never reads or stores it.
- **All auth API calls** use `credentials: "include"` so the browser sends the refresh cookie cross-origin (production: `SameSite=None; Secure` on the API).
- **Bootstrap:** `AuthProvider` always calls `POST /auth/session` on load. A valid cookie restores the session without localStorage.
- **401 retry:** protected requests use a single shared `POST /auth/session` renewal (never parallel `/auth/refresh`), then retry once with the new access token.
- **Proactive renewal:** access tokens renew ~60s before expiry when a protected request runs.
- **2FA login:** `POST /otp/2fa/login/verify` with `Authorization: Bearer <two_factor_session_token>` from the login response (pending JWT in sessionStorage only during the 2FA step).
- **Logout:** `POST /auth/logout` clears server session and cookie; frontend clears in-memory token and session marker.

## Backend Wiring

The frontend API layer lives in `app/lib/api/`:

- `client.ts` unwraps the backend `{ success, data, meta }` envelope, centralizes errors, attaches access tokens, refreshes once on `401`, and retries once.
- `auth.ts`, `otp.ts`, `users.ts`, `admin.ts`, `favorites.ts`, `alerts.ts`, and `gouvernorats.ts` map to the Go gateway routes only (never internal service URLs).

Static catalog, blog, analytics, and flight content remains local because the current Go backend does not expose product/content/access-rule APIs. Do not connect these flows to legacy backends or fake UUIDs.

## Validation

```bash
npm ci
npm run lint
npm run typecheck
npm run format:check
npm run build
```
