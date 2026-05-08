from consumers.base_consumer import BaseConsumer


class PasswordChangedConsumer(BaseConsumer):
    def __init__(self, channel, renderer, mailer, redis_conn):
        super().__init__(channel, "mail.send.password_changed", "mail.send.password_changed", "password_changed", renderer, mailer, redis_conn)

    def subject(self, data) -> str:
        return "Your password was changed"
