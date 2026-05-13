package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
)

func String(key, fallback string) string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		value = fileValue(key)
	}
	if value == "" {
		return fallback
	}
	return value
}

func RequiredString(key string) (string, error) {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		value = fileValue(key)
	}
	if value == "" {
		return "", fmt.Errorf("%s is required", key)
	}
	return value, nil
}

func Bool(key string, fallback bool) bool {
	value := strings.ToLower(String(key, ""))
	if value == "" {
		return fallback
	}
	return value == "1" || value == "true" || value == "yes" || value == "on"
}

func Int(key string, fallback int) (int, error) {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback, nil
	}
	parsed, err := strconv.Atoi(value)
	if err != nil {
		return 0, fmt.Errorf("%s must be an integer: %w", key, err)
	}
	return parsed, nil
}

func Duration(key string, fallback time.Duration) (time.Duration, error) {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback, nil
	}
	parsed, err := time.ParseDuration(value)
	if err != nil {
		return 0, fmt.Errorf("%s must be a duration: %w", key, err)
	}
	return parsed, nil
}

func CSV(key string) []string {
	raw := String(key, "")
	if raw == "" {
		return nil
	}
	parts := strings.Split(raw, ",")
	values := make([]string, 0, len(parts))
	for _, part := range parts {
		item := strings.TrimSpace(part)
		if item != "" {
			values = append(values, item)
		}
	}
	return values
}

func fileValue(key string) string {
	path := strings.TrimSpace(os.Getenv(key + "_FILE"))
	if path == "" {
		return ""
	}
	body, err := os.ReadFile(path)
	if err != nil {
		return ""
	}
	return strings.TrimSpace(string(body))
}
