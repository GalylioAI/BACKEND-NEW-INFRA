# API Reference

All public requests go through the API Gateway.

- Local dev base URL: `http://localhost:8080`
- Production base URL: `https://<your-api-domain>` when Nginx/TLS is enabled, or `http://<vps-ip>:8080` for direct temporary deployments.
- Swagger UI: `/docs` when `DOCS_ENABLED=true`.
- OpenAPI document: `/openapi.yaml`.
- JSON responses always use:

```json
{
  "success": true,
  "data": {},
  "meta": {
    "request_id": "uuid",
    "timestamp": "2026-05-08T00:00:00Z"
  }
}
```

Errors use:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "fields": {}
  },
  "meta": {
    "request_id": "uuid",
    "timestamp": "2026-05-08T00:00:00Z"
  }
}
```

## Authentication

Access tokens are RS256 JWTs returned in response bodies. Refresh tokens are HttpOnly cookies named `refresh_token`, scoped to `Path=/auth`.

For protected routes, send:

```http
Authorization: Bearer <access_token>
```

The frontend must never send `X-User-Id`, `X-User-Role`, `X-User-Email`, or `X-Internal-Secret`; the gateway strips those headers and injects trusted values after JWT verification.

## Auth Endpoints

### `POST /auth/login`

Manual login.

```json
{
  "identifier": "email@example.com",
  "password": "Strong$123"
}
```

Success without 2FA:

```json
{
  "success": true,
  "data": {
    "access_token": "<jwt>",
    "token_type": "Bearer",
    "expires_in": 900
  }
}
```

If 2FA is enabled, the response is still `200`, but no full JWT is issued:

```json
{
  "success": true,
  "data": {
    "two_factor_required": true,
    "two_factor_session_token": "<2fa-pending-jwt>"
  }
}
```

Complete login with `POST /otp/2fa/verify`.

Common errors: `INVALID_CREDENTIALS`, `ACCOUNT_NOT_VERIFIED`, `ACCOUNT_BANNED`, `ACCOUNT_LOCKED`, `USE_GOOGLE_LOGIN`.

### `POST /auth/google`

```json
{
  "id_token": "<google-id-token>"
}
```

Returns the same access token/cookie shape as manual login.

### `POST /auth/refresh`

Uses the HttpOnly `refresh_token` cookie. Send with browser credentials enabled. Returns a new access token and rotates the refresh cookie.

### `POST /auth/logout`

Protected. Revokes the current refresh token and clears the cookie.

### `POST /auth/logout-all`

Protected. Revokes all refresh tokens for the current user.

## User Endpoints

### `POST /users/signup`

```json
{
  "full_name": "Jane Doe",
  "username": "janedoe",
  "email": "jane@example.com",
  "phone": "+21612345678",
  "password": "Strong$123",
  "gouvernorat_id": 1
}
```

Creates an unverified manual user and publishes `user.created`, which triggers OTP email delivery.

### `GET /gouvernorats`

Public. Returns all 24 Tunisian gouvernorats.

### `GET /users/me`

Protected. Returns the current profile.

### `PUT /users/me`

Protected. Partial profile update. Omitted fields are preserved.

```json
{
  "full_name": "Jane A. Doe",
  "username": "janeadoe",
  "phone": "+21612345678",
  "gouvernorat_id": 2
}
```

Email and role cannot be changed here.

### `PUT /users/me/password`

Protected manual users only.

```json
{
  "current_password": "Strong$123",
  "new_password": "NewStrong$123"
}
```

Revokes all refresh tokens and publishes a password-changed mail event.

### `DELETE /users/me`

Protected. Soft-deletes the current account and revokes sessions.

### Admin User Routes

All require `admin` or `superadmin` unless noted.

- `GET /users?page=1&per_page=20`
- `GET /users/{id}`
- `PUT /users/{id}/ban` with `{ "is_banned": true, "reason": "..." }`
- `PUT /users/{id}/role` with `{ "role": "admin" }`, superadmin only
- `DELETE /users/{id}`, superadmin only

## OTP Endpoints

### `POST /otp/email/send`

Protected. Sends a verification OTP to the current user's email.

### `POST /otp/email/verify`

Protected.

```json
{
  "code": "847291"
}
```

Marks the account verified and publishes a welcome email.

### `POST /otp/2fa/enable`

Protected.

```json
{
  "password": "Strong$123"
}
```

Sends a 2FA OTP and returns a pending session token for activation.

### `POST /otp/2fa/verify`

Public because it is used before login completes.

For login 2FA, send the `two_factor_session_token` returned by `/auth/login` as
`Authorization: Bearer <2fa-pending-jwt>`. For confirming 2FA enablement while
already signed in, send the normal access token as `Authorization: Bearer <access-token>`.
The legacy body `session_token` is still accepted for login-token compatibility.

```json
{
  "code": "847291"
}
```

For login context, returns a full access token and refresh cookie. For enable context, enables 2FA.

### `POST /otp/2fa/disable`

Protected. With no code, sends a disable OTP. With a code, verifies and disables 2FA.

```json
{
  "code": "847291"
}
```

### `POST /otp/password-reset/send`

Public and enumeration-safe.

```json
{
  "email": "jane@example.com"
}
```

Always returns the same success message.

### `POST /otp/password-reset/verify`

```json
{
  "email": "jane@example.com",
  "code": "847291"
}
```

Returns a one-time reset token.

### `POST /otp/password-reset/apply`

```json
{
  "reset_token": "<token>",
  "new_password": "NewStrong$123",
  "new_password_confirm": "NewStrong$123"
}
```

Updates the password, revokes sessions, and publishes a security email.

## Favorites Endpoints

All favorites routes are protected.

### `POST /favorites`

```json
{
  "product_id": "00000000-0000-0000-0000-000000000001"
}
```

Returns `409 ALREADY_FAVORITED` on duplicates.

### `GET /favorites?page=1&per_page=20`

Returns paginated favorites.

### `GET /favorites/{product_id}`

Always returns `200`:

```json
{
  "is_favorited": true
}
```

### `DELETE /favorites/{product_id}`

Removes one favorite.

### `DELETE /favorites/all`

Requires:

```http
X-Confirm: clear-all-favorites
```

### `GET /admin/favorites/popular`

Admin+. Query: `limit`, default `10`, max `50`.

## Alerts Endpoints

All user alert routes are protected.

### `POST /alerts`

```json
{
  "product_id": "00000000-0000-0000-0000-000000000001",
  "type": "price_drop",
  "threshold": 49.99
}
```

Types: `price_drop`, `price_above`, `back_in_stock`, `discount`.

Rules:

- `price_drop` and `price_above` require a positive threshold.
- `back_in_stock` and `discount` must omit threshold.
- Duplicate active alerts for the same user, product, and type return `409 DUPLICATE_ALERT`.

### `GET /alerts`

Query params: `page`, `per_page`, `is_active`, `type`.

### `GET /alerts/{id}`

Returns one owned alert.

### `PUT /alerts/{id}`

Updates type and threshold.

### `PUT /alerts/{id}/toggle`

```json
{
  "is_active": true
}
```

Re-enabling a triggered alert resets `triggered_at`.

### `DELETE /alerts/{id}`

Soft-deletes the alert.

### `GET /admin/alerts`

Admin+. Paginated list of all non-deleted alerts.

## Health

### `GET /health`

Gateway health plus upstream service status.

```json
{
  "status": "ok",
  "services": {
    "auth-service": "ok",
    "user-service": "ok",
    "otp-service": "ok",
    "favorites-service": "ok",
    "alerts-service": "ok",
    "redis": "ok"
  }
}
```

## Rate Limits

- `POST /auth/login`: 5 requests/min/IP
- `POST /auth/google`: 5 requests/min/IP
- `POST /users/signup`: 3 requests/min/IP
- `POST /otp/email/send`: 3 requests/min/IP
- `POST /otp/password-reset/send`: 3 requests/min/IP
- All other routes: 60 requests/min/IP

`429` responses include `Retry-After`.
