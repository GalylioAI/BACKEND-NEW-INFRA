import unittest
import tempfile
from pathlib import Path
from types import SimpleNamespace
from unittest import mock

from config import env_value
from models import parse_mail_event
from services.mailer import mask_email, Mailer
from services.renderer import Renderer


class MailServiceTests(unittest.TestCase):
    def test_mask_email(self):
        self.assertEqual(mask_email("jane@example.com"), "j***@example.com")

    def test_parse_enveloped_payload(self):
        envelope, payload, data = parse_mail_event(
            {
                "event_id": "event-1",
                "event_type": "mail.send.email_verify",
                "timestamp": "2026-05-07T00:00:00Z",
                "payload": {
                    "to": "jane@example.com",
                    "template": "email_verify",
                    "data": {"full_name": "Jane", "otp_code": "123456", "expires_in_minutes": 10},
                },
            },
            "email_verify",
        )
        self.assertEqual(envelope.event_id, "event-1")
        self.assertEqual(str(payload.to), "jane@example.com")
        self.assertEqual(data.otp_code, "123456")

    def test_renderer_outputs_html_and_text(self):
        renderer = Renderer(Path(__file__).resolve().parents[1] / "templates")
        html, text = renderer.render("welcome", {"full_name": "Jane"})
        self.assertIn("Jane", html)
        self.assertIn("Jane", text)

    def test_env_value_reads_file_fallback(self):
        with tempfile.TemporaryDirectory() as tmp:
            secret = Path(tmp) / "secret"
            secret.write_text("from-file\n", encoding="utf-8")
            with mock.patch.dict("os.environ", {"MAIL_SECRET_FILE": str(secret)}, clear=False):
                self.assertEqual(env_value("MAIL_SECRET", "fallback"), "from-file")

    def test_smtp_message_has_rfc_required_headers(self):
        config = SimpleNamespace(
            MAIL_PROVIDER="smtp",
            SMTP_HOST="smtp.example.com",
            SMTP_PORT=587,
            SMTP_USER="",
            SMTP_PASS="",
            MAIL_FROM="company@1111.tn",
            SENDGRID_API_KEY="",
        )

        async def capture_send(message, **kwargs):
            capture_send.message = message
            capture_send.kwargs = kwargs

        with mock.patch("services.mailer.aiosmtplib.send", side_effect=capture_send):
            Mailer(config).send_sync("jane@example.com", "Subject", "<p>Hello</p>", "Hello")

        msg = capture_send.message
        self.assertRegex(msg["Message-ID"], r"^<.+@1111\.tn>$")
        self.assertIsNotNone(msg["Date"])
        self.assertEqual(msg.get_content_charset(), None)
        self.assertEqual(capture_send.kwargs["start_tls"], True)


if __name__ == "__main__":
    unittest.main()
