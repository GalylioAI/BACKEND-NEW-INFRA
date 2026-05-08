import time

import pika
import redis
import structlog

from config import load_config
from consumers.alert_triggered import AlertTriggeredConsumer
from consumers.email_verify import EmailVerifyConsumer
from consumers.otp_2fa import OTP2FAConsumer
from consumers.password_changed import PasswordChangedConsumer
from consumers.password_reset import PasswordResetConsumer
from consumers.welcome import WelcomeConsumer
from services.mailer import Mailer
from services.renderer import Renderer


structlog.configure(processors=[structlog.processors.TimeStamper(fmt="iso"), structlog.processors.JSONRenderer()])
log = structlog.get_logger()


def connect(url: str):
    last_error = None
    for _ in range(60):
        try:
            return pika.BlockingConnection(pika.URLParameters(url))
        except Exception as exc:
            last_error = exc
            time.sleep(2)
    raise last_error


def register_consumers(channel, renderer, mailer, redis_conn):
    EmailVerifyConsumer(channel, renderer, mailer, redis_conn)
    WelcomeConsumer(channel, renderer, mailer, redis_conn)
    OTP2FAConsumer(channel, renderer, mailer, redis_conn)
    PasswordResetConsumer(channel, renderer, mailer, redis_conn)
    PasswordChangedConsumer(channel, renderer, mailer, redis_conn)
    AlertTriggeredConsumer(channel, renderer, mailer, redis_conn)


def main():
    cfg = load_config()
    renderer = Renderer()
    mailer = Mailer(cfg)
    redis_conn = redis.from_url(cfg.REDIS_URL, decode_responses=True)
    redis_conn.ping()

    log.info("mail_service_started")
    while True:
        connection = None
        try:
            connection = connect(cfg.RABBITMQ_URL)
            channel = connection.channel()
            register_consumers(channel, renderer, mailer, redis_conn)
            channel.start_consuming()
        except KeyboardInterrupt:
            if connection and connection.is_open:
                connection.close()
            break
        except Exception as exc:
            log.warning("mail_consumer_connection_lost", error_type=type(exc).__name__)
            if connection and connection.is_open:
                connection.close()
            time.sleep(5)
    log.info("shutdown_complete")


if __name__ == "__main__":
    main()
