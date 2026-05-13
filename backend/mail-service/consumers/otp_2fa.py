from consumers.base_consumer import BaseConsumer


class OTP2FAConsumer(BaseConsumer):
    def __init__(self, channel, renderer, mailer, redis_conn):
        super().__init__(channel, "mail.send.otp_2fa", "mail.send.otp_2fa", "otp_2fa", renderer, mailer, redis_conn)

    def subject(self, data) -> str:
        return "Your 2FA verification code"
