from typing import Any, Literal, Optional

from pydantic import BaseModel, EmailStr, Field


class Envelope(BaseModel):
    event_id: str
    event_type: str
    timestamp: str
    payload: dict[str, Any]


class BaseMailPayload(BaseModel):
    to: EmailStr
    template: str
    locale: str = "en"
    data: dict[str, Any]


class EmailVerifyData(BaseModel):
    full_name: str
    otp_code: str = Field(pattern=r"^\d{6}$")
    expires_in_minutes: int = 10


class WelcomeData(BaseModel):
    full_name: str


class PasswordResetData(BaseModel):
    full_name: str
    otp_code: str = Field(pattern=r"^\d{6}$")
    expires_in_minutes: int = 10


class OTP2FAData(BaseModel):
    full_name: str
    otp_code: str = Field(pattern=r"^\d{6}$")
    expires_in_minutes: int = 10


class PasswordChangedData(BaseModel):
    full_name: str
    ip_address: Optional[str] = None
    changed_at: str


class AlertTriggeredData(BaseModel):
    full_name: str
    product_name: str
    alert_type: str
    threshold: Optional[float] = None
    current_value: Optional[float] = None
    product_url: Optional[str] = None


DATA_MODELS = {
    "email_verify": EmailVerifyData,
    "welcome": WelcomeData,
    "password_reset": PasswordResetData,
    "otp_2fa": OTP2FAData,
    "password_changed": PasswordChangedData,
    "alert_triggered": AlertTriggeredData,
}


def parse_mail_event(raw: dict[str, Any], expected_template: str) -> tuple[Envelope, BaseMailPayload, BaseModel]:
    envelope = Envelope.model_validate(raw)
    payload = BaseMailPayload.model_validate(envelope.payload)
    if payload.template != expected_template:
        raise ValueError(f"unexpected template {payload.template}")
    model = DATA_MODELS[expected_template].model_validate(payload.data)
    return envelope, payload, model


MailRoutingKey = Literal[
    "mail.send.email_verify",
    "mail.send.welcome",
    "mail.send.otp_2fa",
    "mail.send.password_reset",
    "mail.send.password_changed",
    "mail.send.alert_triggered",
]
