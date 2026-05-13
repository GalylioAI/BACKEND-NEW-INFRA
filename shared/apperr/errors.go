package apperr

import "net/http"

const (
	CodeValidationError       = "VALIDATION_ERROR"
	CodeInvalidCredentials    = "INVALID_CREDENTIALS"
	CodeAccountNotVerified    = "ACCOUNT_NOT_VERIFIED"
	CodeUseGoogleLogin        = "USE_GOOGLE_LOGIN"
	CodeEmailRegistered       = "EMAIL_ALREADY_REGISTERED"
	CodeAccountLocked         = "ACCOUNT_LOCKED"
	CodeAccountBanned         = "ACCOUNT_BANNED"
	CodeTwoFactorRequired     = "2FA_REQUIRED"
	CodeUnauthorized          = "UNAUTHORIZED"
	CodeForbidden             = "FORBIDDEN"
	CodeNotFound              = "NOT_FOUND"
	CodeConflict              = "CONFLICT"
	CodeAlreadyExists         = "ALREADY_EXISTS"
	CodeRateLimited           = "RATE_LIMITED"
	CodeInternal              = "INTERNAL_ERROR"
	CodeInvalidRefreshToken   = "INVALID_REFRESH_TOKEN"
	CodeInvalidProvider       = "INVALID_AUTH_PROVIDER"
	CodeWeakPassword          = "WEAK_PASSWORD"
	CodeInvalidCurrentPass    = "INVALID_CURRENT_PASSWORD"
	CodePasswordReuse         = "PASSWORD_REUSE"
	CodeLocalPasswordRequired = "LOCAL_PASSWORD_REQUIRED"
	CodeRecentAuthRequired    = "RECENT_AUTH_REQUIRED"
	CodeInvalidRole           = "INVALID_ROLE"
	CodeInternalAuthFailed    = "INTERNAL_AUTH_FAILED"
	CodeInvalidTwoFASession   = "INVALID_2FA_SESSION"
	CodeInvalidGoogleToken    = "INVALID_GOOGLE_TOKEN"
	CodeOTPNotFound           = "OTP_NOT_FOUND"
	CodeOTPExpired            = "OTP_EXPIRED"
	CodeOTPInvalid            = "OTP_INVALID"
	CodeOTPMaxAttempts        = "OTP_MAX_ATTEMPTS_EXCEEDED"
	CodeOTPRateLimited        = "OTP_RATE_LIMIT_EXCEEDED"
	CodeInvalidResetToken     = "INVALID_RESET_TOKEN"
)

type FieldErrors map[string]string

type Error struct {
	Code              string
	Message           string
	Status            int
	Fields            FieldErrors
	Cause             error
	RetryAfterSeconds *int
}

func (e *Error) Error() string {
	if e == nil {
		return ""
	}
	return e.Code + ": " + e.Message
}

func New(status int, code, message string) *Error {
	return &Error{Status: status, Code: code, Message: message}
}

func WithFields(status int, code, message string, fields FieldErrors) *Error {
	return &Error{Status: status, Code: code, Message: message, Fields: fields}
}

func Wrap(status int, code, message string, cause error) *Error {
	return &Error{Status: status, Code: code, Message: message, Cause: cause}
}

func WithRetryAfter(status int, code, message string, seconds int) *Error {
	return &Error{Status: status, Code: code, Message: message, RetryAfterSeconds: &seconds}
}

func Validation(fields FieldErrors) *Error {
	return WithFields(http.StatusUnprocessableEntity, CodeValidationError, "Request validation failed.", fields)
}

func InvalidCredentials() *Error {
	return New(http.StatusUnauthorized, CodeInvalidCredentials, "The email/username or password you entered is incorrect.")
}

func Internal() *Error {
	return New(http.StatusInternalServerError, CodeInternal, "Something went wrong. Please try again later.")
}

func From(err error) *Error {
	if err == nil {
		return nil
	}
	if app, ok := err.(*Error); ok {
		return app
	}
	return Internal()
}
