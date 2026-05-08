package httpjson

import (
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"backend/shared/apperr"
)

type Meta struct {
	RequestID string    `json:"request_id"`
	Timestamp time.Time `json:"timestamp"`
}

type Success struct {
	Success bool `json:"success"`
	Data    any  `json:"data,omitempty"`
	Meta    Meta `json:"meta"`
}

type ErrorBody struct {
	Code              string             `json:"code"`
	Message           string             `json:"message"`
	Fields            apperr.FieldErrors `json:"fields,omitempty"`
	RetryAfterSeconds *int               `json:"retry_after_seconds,omitempty"`
}

type Failure struct {
	Success bool      `json:"success"`
	Error   ErrorBody `json:"error"`
	Meta    Meta      `json:"meta"`
}

func meta(r *http.Request) Meta {
	requestID := r.Header.Get("X-Request-Id")
	if requestID == "" {
		requestID = "unknown"
	}
	return Meta{
		RequestID: requestID,
		Timestamp: time.Now().UTC(),
	}
}

func Write(w http.ResponseWriter, r *http.Request, status int, data any) {
	writeJSON(w, status, Success{Success: true, Data: data, Meta: meta(r)})
}

func WriteNoContent(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, Success{Success: true, Data: map[string]bool{"ok": true}, Meta: meta(r)})
}

func WriteError(w http.ResponseWriter, r *http.Request, err error) {
	app := apperr.From(err)
	status := app.Status
	if status == 0 {
		status = http.StatusInternalServerError
	}
	writeJSON(w, status, Failure{
		Success: false,
		Error: ErrorBody{
			Code:              app.Code,
			Message:           app.Message,
			Fields:            app.Fields,
			RetryAfterSeconds: app.RetryAfterSeconds,
		},
		Meta: meta(r),
	})
}

func Decode(r *http.Request, dst any) error {
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(dst); err != nil {
		return apperr.New(http.StatusBadRequest, apperr.CodeValidationError, "Request body must be valid JSON.")
	}
	if decoder.More() {
		return apperr.New(http.StatusBadRequest, apperr.CodeValidationError, "Request body must contain a single JSON object.")
	}
	return nil
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}

func MethodNotAllowed(w http.ResponseWriter, r *http.Request) {
	WriteError(w, r, apperr.New(http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "This method is not allowed."))
}

func NotFound(w http.ResponseWriter, r *http.Request) {
	WriteError(w, r, apperr.New(http.StatusNotFound, apperr.CodeNotFound, "The requested resource was not found."))
}

func IsClientAbort(err error) bool {
	return errors.Is(err, http.ErrAbortHandler)
}
