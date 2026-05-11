import unittest
import tempfile
from pathlib import Path
from unittest import mock

from config import env_value
from models import parse_mail_event
from services.mailer import mask_email
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


if __name__ == "__main__":
    unittest.main()
