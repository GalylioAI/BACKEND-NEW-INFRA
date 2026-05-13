package rabbit

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"
	amqp "github.com/rabbitmq/amqp091-go"
	"github.com/rs/zerolog"
)

const Exchange = "app.events"

type Publisher interface {
	Publish(ctx context.Context, routingKey string, payload any) error
	Close() error
}

type Event struct {
	EventID   string    `json:"event_id"`
	EventType string    `json:"event_type"`
	Timestamp time.Time `json:"timestamp"`
	Payload   any       `json:"payload"`
}

type AMQPPublisher struct {
	url       string
	conn      *amqp.Connection
	ch        *amqp.Channel
	mu        sync.RWMutex
	opMu      sync.Mutex
	done      chan struct{}
	closeOnce sync.Once
	ready     chan struct{}
	logger    zerolog.Logger
}

func New(url string) (*AMQPPublisher, error) {
	return NewManaged(url, zerolog.Nop())
}

func NewManaged(url string, logger zerolog.Logger) (*AMQPPublisher, error) {
	p := &AMQPPublisher{
		url:    url,
		done:   make(chan struct{}),
		ready:  make(chan struct{}, 1),
		logger: logger,
	}
	notify, err := p.connect()
	if err != nil {
		return nil, err
	}
	go p.watch(notify)
	return p, nil
}

func (p *AMQPPublisher) connect() (<-chan *amqp.Error, error) {
	conn, err := amqp.Dial(p.url)
	if err != nil {
		return nil, err
	}
	ch, err := conn.Channel()
	if err != nil {
		_ = conn.Close()
		return nil, err
	}
	if err := ch.ExchangeDeclare(Exchange, "topic", true, false, false, false, nil); err != nil {
		_ = ch.Close()
		_ = conn.Close()
		return nil, err
	}

	p.mu.Lock()
	oldCh := p.ch
	oldConn := p.conn
	p.conn = conn
	p.ch = ch
	p.mu.Unlock()

	if oldCh != nil {
		_ = oldCh.Close()
	}
	if oldConn != nil {
		_ = oldConn.Close()
	}

	return conn.NotifyClose(make(chan *amqp.Error, 1)), nil
}

func (p *AMQPPublisher) watch(notify <-chan *amqp.Error) {
	for {
		select {
		case <-p.done:
			return
		case err, ok := <-notify:
			if !ok {
				err = amqp.ErrClosed
			}
			if err != nil && !errors.Is(err, amqp.ErrClosed) {
				p.logger.Warn().Err(err).Msg("rabbitmq connection lost")
			}

			for {
				select {
				case <-p.done:
					return
				case <-time.After(5 * time.Second):
				}

				nextNotify, reconnectErr := p.connect()
				if reconnectErr != nil {
					p.logger.Warn().Err(reconnectErr).Msg("rabbitmq reconnect failed")
					continue
				}
				p.logger.Info().Msg("rabbitmq reconnected")
				select {
				case p.ready <- struct{}{}:
				default:
				}
				notify = nextNotify
				break
			}
		}
	}
}

func DeclareExchange(ch *amqp.Channel) error {
	return ch.ExchangeDeclare(Exchange, "topic", true, false, false, false, nil)
}

func DeclareBoundQueue(ch *amqp.Channel, queueName, routingKey string) (amqp.Queue, error) {
	queue, err := ch.QueueDeclare(queueName, true, false, false, false, nil)
	if err != nil {
		return amqp.Queue{}, err
	}
	if err := ch.QueueBind(queue.Name, routingKey, Exchange, false, nil); err != nil {
		return amqp.Queue{}, err
	}
	return queue, nil
}

func (p *AMQPPublisher) Channel() *amqp.Channel {
	if p == nil {
		return nil
	}
	p.mu.RLock()
	defer p.mu.RUnlock()
	return p.ch
}

func (p *AMQPPublisher) NewChannel() (*amqp.Channel, error) {
	if p == nil {
		return nil, fmt.Errorf("rabbitmq publisher is nil")
	}
	p.mu.RLock()
	conn := p.conn
	p.mu.RUnlock()
	if conn == nil {
		return nil, fmt.Errorf("rabbitmq connection is not ready")
	}
	ch, err := conn.Channel()
	if err != nil {
		return nil, err
	}
	if err := DeclareExchange(ch); err != nil {
		_ = ch.Close()
		return nil, err
	}
	return ch, nil
}

func (p *AMQPPublisher) NotifyReady() <-chan struct{} {
	if p == nil {
		closed := make(chan struct{})
		close(closed)
		return closed
	}
	return p.ready
}

func (p *AMQPPublisher) Check(ctx context.Context) error {
	if p == nil {
		return fmt.Errorf("rabbitmq channel is not ready")
	}
	p.opMu.Lock()
	defer p.opMu.Unlock()
	p.mu.RLock()
	defer p.mu.RUnlock()
	ch := p.ch
	if ch == nil {
		return fmt.Errorf("rabbitmq channel is not ready")
	}
	return ch.ExchangeDeclarePassive(Exchange, "topic", true, false, false, false, nil)
}

func (p *AMQPPublisher) Publish(ctx context.Context, routingKey string, payload any) error {
	body, err := json.Marshal(Event{
		EventID:   uuid.NewString(),
		EventType: routingKey,
		Timestamp: time.Now().UTC(),
		Payload:   payload,
	})
	if err != nil {
		return err
	}
	if p == nil {
		return fmt.Errorf("rabbitmq publisher is nil")
	}
	p.opMu.Lock()
	defer p.opMu.Unlock()
	p.mu.RLock()
	defer p.mu.RUnlock()
	ch := p.ch
	if ch == nil {
		return fmt.Errorf("rabbitmq channel is not ready")
	}
	return ch.PublishWithContext(ctx, Exchange, routingKey, false, false, amqp.Publishing{
		ContentType:  "application/json",
		DeliveryMode: amqp.Persistent,
		Body:         body,
	})
}

func (p *AMQPPublisher) Close() error {
	if p == nil {
		return nil
	}
	var err error
	p.closeOnce.Do(func() {
		close(p.done)
		p.mu.Lock()
		ch := p.ch
		conn := p.conn
		p.ch = nil
		p.conn = nil
		p.mu.Unlock()
		if ch != nil {
			_ = ch.Close()
		}
		if conn != nil {
			err = conn.Close()
		}
	})
	return err
}
