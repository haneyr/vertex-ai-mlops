"""Google OAuth token verification."""

import logging

import google.auth.transport.requests
from google.oauth2 import id_token as google_id_token

from ..config import OAUTH_CLIENT_ID

logger = logging.getLogger(__name__)

_request = None


def _get_request():
    global _request
    if _request is None:
        _request = google.auth.transport.requests.Request()
    return _request


def is_auth_enabled() -> bool:
    return bool(OAUTH_CLIENT_ID)


def verify_id_token(token: str) -> dict | None:
    """Verify a Google ID token and return user info, or None if invalid."""
    if not token:
        return None
    try:
        idinfo = google_id_token.verify_oauth2_token(
            token, _get_request(), OAUTH_CLIENT_ID,
        )
        return {
            "email": idinfo.get("email", ""),
            "name": idinfo.get("name", ""),
            "picture": idinfo.get("picture", ""),
        }
    except (ValueError, Exception):
        logger.debug("Token verification failed", exc_info=True)
        return None
