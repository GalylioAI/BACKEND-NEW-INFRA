from consumers.base_consumer import BaseConsumer


class WelcomeConsumer(BaseConsumer):
    def __init__(self, channel, renderer, mailer, redis_conn):
        super().__init__(channel, "mail.send.welcome", "mail.send.welcome", "welcome", renderer, mailer, redis_conn)

    def subject(self, data) -> str:
        return "Welcome"
