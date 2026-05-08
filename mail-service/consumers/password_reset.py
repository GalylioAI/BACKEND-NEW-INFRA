from consumers.base_consumer import BaseConsumer


class PasswordResetConsumer(BaseConsumer):
    def __init__(self, channel, renderer, mailer, redis_conn):
        super().__init__(channel, "mail.send.password_reset", "mail.send.password_reset", "password_reset", renderer, mailer, redis_conn)

    def subject(self, data) -> str:
        return "Reset your password"
