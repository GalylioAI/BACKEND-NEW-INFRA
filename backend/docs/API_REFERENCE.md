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
Access JWTs include `auth_time`, `amr`, and `sid`. Refresh keeps the original `auth_time` and `amr`; it only renews `iat`, `exp`, and `jti`.

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

Complete login with `POST /otp/2fa/login/verify`.

Common errors: `INVALID_CREDENTIALS`, `ACCOUNT_NOT_VERIFIED`, `ACCOUNT_BANNED`, `ACCOUNT_LOCKED`, `USE_GOOGLE_LOGIN`.

### `POST /auth/google`

```json
{
  "id_token": "<google-id-token>"
}
```

Returns the same access token/cookie shape as manual login, or a 2FA pending-token response when the Google user has 2FA enabled.

### `POST /auth/refresh`

Uses the HttpOnly refresh cookie. Send with browser credentials enabled. Returns a new access token and rotates the refresh cookie.

### `POST /auth/logout`

Optional access JWT. Always clears the refresh cookie. If a valid session can be identified, revokes the current refresh token.

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

### `POST /users/me/password/set`

Protected. Sets the first local password for an OAuth-linked account.

```json
{
  "new_password": "Strong$123",
  "new_password_confirm": "Strong$123"
}
```

Only users without a local password can use this route. If 2FA is enabled, the access token must come from a recent 2FA-completed login. On success, the current session remains active and all other refresh sessions are revoked.

### `DELETE /users/me`

Protected. Soft-deletes the current account and revokes sessions.

### Admin User Routes

All require `admin` or `superadmin` unless noted.

- `GET /users?page=1&per_page=20`
- `GET /users/{id}`
- `PUT /users/{id}/ban` with `{ "is_banned": true, "reason": "..." }`; admin may affect users, superadmin required for admin/superadmin targets
- `PUT /users/{id}/role` with `{ "role": "admin" }` or `{ "role": "superadmin" }`, superadmin only
- `DELETE /users/{id}`; admin may delete users, superadmin required for admin/superadmin targets

## OTP Endpoints

### `POST /otp/email/send`

Public. Sends a verification OTP to the submitted email when the account exists and is eligible.

### `POST /otp/email/verify`

Public.

```json
{
  "email": "jane@example.com",
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

Verifies the current password, creates a `2fa_enable` challenge, and sends a 2FA enable OTP. It does not enable 2FA yet.

### `POST /otp/2fa/enable/verify`

Protected. Confirms 2FA enablement with the setup OTP, consumes the `2fa_enable` challenge, and enables 2FA.

```json
{
  "code": "847291"
}
```

### `POST /otp/2fa/login/verify`

Public pending-token endpoint because it is used before login completes.

For login 2FA, send the `two_factor_session_token` returned by `/auth/login` as
`Authorization: Bearer <2fa-pending-jwt>`. Normal access tokens and body session
tokens are rejected.

```json
{
  "code": "847291"
}
```

Returns a full access token and refresh cookie. The returned access JWT keeps the full method chain in `amr`, for example `["password","otp"]` or `["google","otp"]`.

### `POST /otp/2fa/disable`

Protected. Starts 2FA disablement. Requires a local `current_password`, creates a `2fa_disable` challenge, and sends a disable OTP. It does not disable 2FA yet.

OAuth-only users without a local password receive `LOCAL_PASSWORD_REQUIRED` with message `Set a local password before disabling 2FA.`

```json
{
  "current_password": "Strong$123"
}
```

### `POST /otp/2fa/disable/verify`

Protected. Confirms 2FA disablement with the disable OTP, consumes the `2fa_disable` challenge, and disables 2FA.

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
