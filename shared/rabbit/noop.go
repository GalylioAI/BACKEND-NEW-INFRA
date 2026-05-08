package rabbit

import "context"

type NoopPublisher struct{}

func (NoopPublisher) Publish(context.Context, string, any) error { return nil }
func (NoopPublisher) Close() error                               { return nil }
