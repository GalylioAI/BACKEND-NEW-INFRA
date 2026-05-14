# Frontend Integration

The production frontend origin is `https://1111.tn`. The only public backend origin is `https://backend.1111.tn`.

## Environment

Frontend:

```env
NEXT_PUBLIC_API_BASE_URL=https://backend.1111.tn
NEXT_PUBLIC_APP_URL=https://1111.tn
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<google-oauth-web-client-id>
```

Backend:

```env
APP_ENV=production
BASE_API_URL=https://backend.1111.tn
FRONTEND_URL=https://1111.tn
CORS_ALLOWED_ORIGINS=https://1111.tn
CORS_ALLOW_CREDENTIALS=true
REFRESH_COOKIE_DOMAIN=backend.1111.tn
REFRESH_COOKIE_PATH=/auth
REFRESH_COOKIE_SECURE=true
REFRESH_COOKIE_HTTPONLY=true
REFRESH_COOKIE_SAMESITE=Lax
```

No wildcard CORS is allowed in production.

## Auth Contract

- `POST /auth/login` accepts `{ "identifier": "<email-or-username>", "password": "<password>" }`.
- `POST /auth/google` accepts `{ "id_token": "<google-id-token>" }` from Google Identity Services. The same endpoint powers both "login with Google" and "signup with Google"; new Google users are created by the backend.
- Normal login returns `access_token` and `access_token_expires_at`.
- 2FA login returns `two_factor_required: true` and `two_factor_session_token`.
- `POST /otp/2fa/login/verify` sends `Authorization: Bearer <two_factor_session_token>`.
- `POST /otp/2fa/enable/verify` sends `Authorization: Bearer <access_token>`.
- `POST /auth/refresh` sends no request body and must use `credentials: "include"`.
- The refresh token is stored only in the HttpOnly cookie.
- `POST /auth/logout` clears the refresh cookie; the frontend should clear local auth state even if the access token is expired.
- `POST /auth/logout-all` requires a valid access token.

The removed legacy endpoint `/otp/2fa/verify` must not be used.

## Request Rules

Protected requests send:

```http
Authorization: Bearer <access_token>
```

Browser requests that need refresh-cookie behavior must set:

```ts
credentials: "include"
```

The frontend should refresh once after a `401`, retry the original request once, and then clear auth state if refresh fails.
