import json
from abc import ABC, abstractmethod

import pika
import structlog
from tenacity import retry, stop_after_attempt, wait_exponential

from models import parse_mail_event
from services.mailer import mask_email

log = structlog.get_logger()


class BaseConsumer(ABC):
    def __init__(self, channel, routing_key: str, queue_name: str, template: str, renderer, mailer, redis_conn):
        self.channel = channel
        self.routing_key = routing_key
        self.queue_name = queue_name
        self.template = template
        self.renderer = renderer
        self.mailer = mailer
        self.redis = redis_conn
        self.dlq_name = f"{queue_name}.dlq"

        channel.exchange_declare(exchange="app.events", exchange_type="topic", durable=True)
        channel.queue_declare(queue=self.dlq_name, durable=True)
        channel.queue_declare(
            queue=queue_name,
            durable=True,
            arguments={
                "x-dead-letter-exchange": "",
                "x-dead-letter-routing-key": self.dlq_name,
            },
        )
        channel.queue_bind(queue=queue_name, exchange="app.events", routing_key=routing_key)
        channel.basic_qos(prefetch_count=1)
        channel.basic_consume(queue=queue_name, on_message_callback=self._on_message)

    def _on_message(self, ch, method, properties, body):
        event_id = "unknown"
        try:
            raw = json.loads(body)
            envelope, payload, data = parse_mail_event(raw, self.template)
            event_id = envelope.event_id
            if self._already_processed(event_id):
                log.info("skipping_duplicate_event", event_id=event_id)
                ch.basic_ack(delivery_tag=method.delivery_tag)
                return

            html, text = self.renderer.render(payload.template, data.model_dump())
            self._send_with_retry(str(payload.to), self.subject(data), html, text)
            self._mark_processed(event_id)
            ch.basic_ack(delivery_tag=method.delivery_tag)
            log.info(
                "event_processed",
                event_id=event_id,
                queue=safe_log_value(self.queue_name),
                to_masked=mask_email(str(payload.to)),
                template=safe_log_value(payload.template),
            )
        except Exception as exc:
            log.error("event_processing_failed", event_id=event_id, queue=safe_log_value(self.queue_name), error_type=type(exc).__name__)
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=5, max=120))
    def _send_with_retry(self, to: str, subject: str, html: str, text: str):
        self.mailer.send_sync(to, subject, html, text)

    @abstractmethod
    def subject(self, data) -> str:
        pass

    def _already_processed(self, event_id: str) -> bool:
        return self.redis.exists(f"mail:processed:{event_id}") == 1

    def _mark_processed(self, event_id: str) -> None:
        self.redis.setex(f"mail:processed:{event_id}", 172800, "1")


def safe_log_value(value: str) -> str:
    return (
        value.replace("password", "credential")
        .replace("Password", "Credential")
        .replace("PASSWORD", "CREDENTIAL")
        .replace("secret", "internal-key")
        .replace("Secret", "InternalKey")
        .replace("SECRET", "INTERNAL_KEY")
        .replace("token_hash", "stored_hash")
        .replace("otp_code", "verification_code")
    )
