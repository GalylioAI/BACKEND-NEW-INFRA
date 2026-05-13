package migration

import (
	"errors"
	"fmt"
	"regexp"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

var credentialURLPattern = regexp.MustCompile(`(?i)(postgres(?:ql)?://[^:\s/@]+:)([^@\s]+)(@)`)

func Run(databaseURL, migrationsPath string) error {
	if databaseURL == "" {
		return errors.New("migration database URL is required")
	}
	if migrationsPath == "" {
		migrationsPath = "file://migrations"
	}

	m, err := migrate.New(migrationsPath, databaseURL)
	if err != nil {
		return fmt.Errorf("migration init failed: %s", redact(err.Error()))
	}
	defer func() {
		_, _ = m.Close()
	}()

	if err := m.Up(); err != nil && !errors.Is(err, migrate.ErrNoChange) {
		return fmt.Errorf("migration failed: %s", redact(err.Error()))
	}

	return nil
}

func redact(value string) string {
	return credentialURLPattern.ReplaceAllString(value, "${1}<redacted>${3}")
}
