import asyncio
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formatdate, make_msgid

import aiosmtplib
import structlog
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

log = structlog.get_logger()


def _message_id_domain(mail_from: str) -> str:
    if "@" not in mail_from:
        return "localhost"
    return mail_from.rsplit("@", 1)[1].strip() or "localhost"


def mask_email(email: str) -> str:
    local, domain = email.split("@", 1)
    first = local[0] if local else "*"
    return f"{first}***@{domain}"


class Mailer:
    def __init__(self, config):
        self.config = config

    async def send(self, to: str, subject: str, html: str, text: str) -> None:
        if self.config.MAIL_PROVIDER == "sendgrid":
            self._send_sendgrid(to, subject, html, text)
            return
        if self.config.MAIL_PROVIDER == "dry_run":
            log.info("email_dry_run", to_masked=mask_email(to), subject=subject)
            return
        await self._send_smtp(to, subject, html, text)

    def send_sync(self, to: str, subject: str, html: str, text: str) -> None:
        asyncio.run(self.send(to, subject, html, text))

    async def _send_smtp(self, to: str, subject: str, html: str, text: str) -> None:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = self.config.MAIL_FROM
        msg["To"] = to
        msg["Date"] = formatdate(localtime=False, usegmt=True)
        msg["Message-ID"] = make_msgid(domain=_message_id_domain(self.config.MAIL_FROM))
        msg.attach(MIMEText(text, "plain", "utf-8"))
        msg.attach(MIMEText(html, "html", "utf-8"))

        kwargs = {
            "hostname": self.config.SMTP_HOST,
            "port": self.config.SMTP_PORT,
            "use_tls": self.config.SMTP_PORT == 465,
            "start_tls": self.config.SMTP_PORT == 587,
        }
        if self.config.SMTP_USER:
            kwargs["username"] = self.config.SMTP_USER
            kwargs["password"] = self.config.SMTP_PASS
        await aiosmtplib.send(msg, **kwargs)

    def _send_sendgrid(self, to: str, subject: str, html: str, text: str) -> None:
        if not self.config.SENDGRID_API_KEY:
            raise RuntimeError("SENDGRID_API_KEY is required for SendGrid provider")
        message = Mail(from_email=self.config.MAIL_FROM, to_emails=to, subject=subject, html_content=html, plain_text_content=text)
        SendGridAPIClient(self.config.SENDGRID_API_KEY).send(message)
