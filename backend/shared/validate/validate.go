package validate

import (
	"fmt"
	"regexp"
	"strings"
	"unicode"

	"backend/shared/apperr"

	"github.com/go-playground/validator/v10"
)

var (
	emailRE = regexp.MustCompile(`^[a-zA-Z0-9.!#$%&'*+/=?^_{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$`)
	phoneRE = regexp.MustCompile(`^(?:\+216)?[0-9]{8}$`)
)

type Validator struct {
	v *validator.Validate
}

type ValidationError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

func New() *Validator {
	return &Validator{v: validator.New()}
}

func (v *Validator) Struct(value any) error {
	if errors := Validate(value); len(errors) > 0 {
		return apperr.Validation(Fields(errors))
	}
	return nil
}

func Validate(value any) []ValidationError {
	err := validator.New().Struct(value)
	if err == nil {
		return nil
	}
	validationErrors, ok := err.(validator.ValidationErrors)
	if !ok {
		return []ValidationError{{Field: "request", Message: "Request validation failed."}}
	}
	out := make([]ValidationError, 0, len(validationErrors))
	for _, fieldErr := range validationErrors {
		out = append(out, ValidationError{
			Field:   jsonFieldName(fieldErr),
			Message: messageFor(fieldErr),
		})
	}
	return out
}

func Fields(errors []ValidationError) apperr.FieldErrors {
	fields := apperr.FieldErrors{}
	for _, err := range errors {
		fields[err.Field] = err.Message
	}
	return fields
}

func jsonFieldName(err validator.FieldError) string {
	return toSnake(err.Field())
}

func messageFor(err validator.FieldError) string {
	switch err.Tag() {
	case "required":
		return "This field is required."
	case "email":
		return "Must be a valid email address."
	case "len":
		if err.Param() == "6" && strings.EqualFold(err.Field(), "Code") {
			return "Must be exactly 6 digits."
		}
		return fmt.Sprintf("Must be exactly %s characters.", err.Param())
	case "numeric":
		return "Must contain only numbers."
	case "max":
		return fmt.Sprintf("Must be at most %s characters.", err.Param())
	case "min":
		return fmt.Sprintf("Must be at least %s characters.", err.Param())
	case "oneof":
		return "Must be one of the allowed values."
	default:
		return "Invalid value."
	}
}

func toSnake(value string) string {
	var b strings.Builder
	for i, r := range value {
		if unicode.IsUpper(r) && i > 0 {
			b.WriteByte('_')
		}
		b.WriteRune(unicode.ToLower(r))
	}
	return b.String()
}

func NormalizeEmail(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}

func NormalizeUsername(username string) string {
	return strings.ToLower(strings.TrimSpace(username))
}

func NormalizePhone(phone string) string {
	value := strings.TrimSpace(phone)
	if value == "" {
		return ""
	}
	value = strings.ReplaceAll(value, " ", "")
	value = strings.ReplaceAll(value, "-", "")
	if strings.HasPrefix(value, "+216") {
		return value
	}
	return "+216" + value
}

func ValidEmail(email string) bool {
	return emailRE.MatchString(email)
}

func ValidTunisianPhone(phone string) bool {
	return phone == "" || phoneRE.MatchString(strings.TrimPrefix(phone, "+216")) || phoneRE.MatchString(phone)
}

func PasswordFields(password string) map[string]bool {
	fields := map[string]bool{"min": len(password) >= 8, "upper": false, "number": false, "special": false}
	for _, r := range password {
		switch {
		case unicode.IsUpper(r):
			fields["upper"] = true
		case unicode.IsDigit(r):
			fields["number"] = true
		case unicode.IsPunct(r) || unicode.IsSymbol(r):
			fields["special"] = true
		}
	}
	return fields
}

func StrongPassword(password string) bool {
	fields := PasswordFields(password)
	return fields["min"] && fields["upper"] && fields["number"] && fields["special"]
}
