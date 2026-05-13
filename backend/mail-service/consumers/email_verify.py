from consumers.base_consumer import BaseConsumer


class EmailVerifyConsumer(BaseConsumer):
    def __init__(self, channel, renderer, mailer, redis_conn):
        super().__init__(channel, "mail.send.email_verify", "mail.send.email_verify", "email_verify", renderer, mailer, redis_conn)

    def subject(self, data) -> str:
        return "Verify your email address"
