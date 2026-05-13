package db

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Config struct {
	Host         string
	Port         int
	Name         string
	User         string
	Password     string
	SSLMode      string
	MaxOpenConns int32
	MaxIdleConns int32
	QueryTimeout time.Duration
}

func Connect(ctx context.Context, cfg Config) (*pgxpool.Pool, error) {
	sslMode := cfg.SSLMode
	if sslMode == "" {
		sslMode = "disable"
	}
	dsn := fmt.Sprintf("postgres://%s:%s@%s:%d/%s?sslmode=%s", cfg.User, cfg.Password, cfg.Host, cfg.Port, cfg.Name, sslMode)
	poolCfg, err := pgxpool.ParseConfig(dsn)
	if err != nil {
		return nil, err
	}
	poolCfg.ConnConfig.DefaultQueryExecMode = pgx.QueryExecModeSimpleProtocol
	if cfg.MaxOpenConns > 0 {
		poolCfg.MaxConns = cfg.MaxOpenConns
	}
	if cfg.MaxIdleConns > 0 {
		poolCfg.MinConns = cfg.MaxIdleConns
	}
	pool, err := pgxpool.NewWithConfig(ctx, poolCfg)
	if err != nil {
		return nil, err
	}
	pingCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	if err := pool.Ping(pingCtx); err != nil {
		pool.Close()
		return nil, err
	}
	return pool, nil
}

func Timeout(ctx context.Context) (context.Context, context.CancelFunc) {
	return context.WithTimeout(ctx, 5*time.Second)
}
