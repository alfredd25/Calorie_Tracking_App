import logging
import os

import resend

from app.core.celery_worker import celery_app

logger = logging.getLogger(__name__)

RESEND_FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL", "noreply@nutritracks.tech")


@celery_app.task(
    bind=True,
    max_retries=3,
    default_retry_delay=30,
    name="app.tasks.email_tasks.send_reset_email",
)
def send_reset_email(self, recipient_email: str, reset_link: str) -> None:
    """Send a password-reset email via Resend.

    Retries up to 3 times (30-second back-off) on transient failures.
    """
    api_key = os.getenv("RESEND_API_KEY")
    if not api_key:
        # Configuration error — no point retrying.
        logger.error("RESEND_API_KEY is not configured; cannot send reset email.")
        raise RuntimeError("Email service is not configured")

    resend.api_key = api_key

    try:
        resend.Emails.send({
            "from": RESEND_FROM_EMAIL,
            "to": recipient_email,
            "subject": "Reset your NutriTrack password",
            "html": f"""
                <h2>Reset your password</h2>
                <p>Click the link below to reset your password. This link expires in 15 minutes.</p>
                <a href='{reset_link}' style='
                    background-color: #16a34a;
                    color: white;
                    padding: 12px 24px;
                    border-radius: 6px;
                    text-decoration: none;
                    display: inline-block;
                '>Reset Password</a>
                <p>If you didn't request this, ignore this email.</p>
                <p>— The NutriTrack Team</p>
            """,
        })
        logger.info("Password reset email sent to %s", recipient_email)
    except Exception as exc:
        logger.exception("Failed to send password reset email to %s", recipient_email)
        raise self.retry(exc=exc)
