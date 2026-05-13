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


def env_value(key: str, default: str = "") -> str:
    value = os.getenv(key)
    if value:
        return value.strip()
    file_path = os.getenv(f"{key}_FILE")
    if file_path:
        try:
            with open(file_path, "r", encoding="utf-8") as handle:
                return handle.read().strip()
        except OSError:
            return default
    return default


def load_config() -> Config:
    load_dotenv()
    return Config(
        RABBITMQ_URL=env_value("RABBITMQ_URL", "amqp://app:app_pass@rabbitmq:5672/"),
        REDIS_URL=env_value("REDIS_URL", "redis://:redis_pass@redis:6379/1"),
        MAIL_PROVIDER=env_value("MAIL_PROVIDER", "smtp").lower(),
        SMTP_HOST=env_value("SMTP_HOST", "mailpit"),
        SMTP_PORT=int(env_value("SMTP_PORT", "1025")),
        SMTP_USER=env_value("SMTP_USER", ""),
        SMTP_PASS=env_value("SMTP_PASS", ""),
        MAIL_FROM=env_value("MAIL_FROM", "noreply@yourdomain.com"),
        SENDGRID_API_KEY=env_value("SENDGRID_API_KEY", ""),
        APP_NAME=env_value("APP_NAME", "Your App"),
    )
