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

Only public browser-safe values may use `NEXT_PUBLIC_*`. Refresh tokens are never stored by the frontend; they are kept in the backend HttpOnly cookie.

## Backend Wiring

The frontend API layer lives in `app/lib/api/`:

- `client.ts` unwraps the backend `{ success, data, meta }` envelope, centralizes errors, attaches access tokens, refreshes once on `401`, and retries once.
- `auth.ts`, `otp.ts`, `users.ts`, `admin.ts`, `favorites.ts`, `alerts.ts`, and `gouvernorats.ts` map to the Go gateway routes.
- Access tokens are in memory only. The refresh token is only sent by the browser cookie with `credentials: "include"`.

Static catalog, blog, analytics, and flight content remains local because the current Go backend does not expose product/content/access-rule APIs. Do not connect these flows to legacy backends or fake UUIDs.

## Validation

```bash
npm ci
npm run lint
npm run typecheck
npm run format:check
npm run build
```
