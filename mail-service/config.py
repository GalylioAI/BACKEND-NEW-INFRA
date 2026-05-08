import os
from dataclasses import dataclass

from dotenv import load_dotenv


@dataclass(frozen=True)
class Config:
    RABBITMQ_URL: str
    REDIS_URL: str
    MAIL_PROVIDER: str
    SMTP_HOST: str
    SMTP_PORT: int
    SMTP_USER: str
    SMTP_PASS: str
    MAIL_FROM: str
    SENDGRID_API_KEY: str
    APP_NAME: str


def load_config() -> Config:
    load_dotenv()
    return Config(
        RABBITMQ_URL=os.getenv("RABBITMQ_URL", "amqp://app:app_pass@rabbitmq:5672/"),
        REDIS_URL=os.getenv("REDIS_URL", "redis://:redis_pass@redis:6379/1"),
        MAIL_PROVIDER=os.getenv("MAIL_PROVIDER", "smtp").lower(),
        SMTP_HOST=os.getenv("SMTP_HOST", "mailpit"),
        SMTP_PORT=int(os.getenv("SMTP_PORT", "1025")),
        SMTP_USER=os.getenv("SMTP_USER", ""),
        SMTP_PASS=os.getenv("SMTP_PASS", ""),
        MAIL_FROM=os.getenv("MAIL_FROM", "noreply@yourdomain.com"),
        SENDGRID_API_KEY=os.getenv("SENDGRID_API_KEY", ""),
        APP_NAME=os.getenv("APP_NAME", "Your App"),
    )
