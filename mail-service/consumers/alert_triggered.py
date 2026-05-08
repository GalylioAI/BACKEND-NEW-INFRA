from consumers.base_consumer import BaseConsumer


class AlertTriggeredConsumer(BaseConsumer):
    def __init__(self, channel, renderer, mailer, redis_conn):
        super().__init__(channel, "mail.send.alert_triggered", "mail.send.alert_triggered", "alert_triggered", renderer, mailer, redis_conn)

    def subject(self, data) -> str:
        return f"Product alert: {data.product_name}"
