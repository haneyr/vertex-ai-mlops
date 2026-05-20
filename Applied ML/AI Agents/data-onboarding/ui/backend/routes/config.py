"""App configuration endpoint."""

from fastapi import APIRouter

from ..config import OAUTH_CLIENT_ID

router = APIRouter(tags=["config"])


@router.get("/api/config")
async def get_config():
    """Return client-side configuration (e.g., whether OAuth is enabled)."""
    return {"oauth_client_id": OAUTH_CLIENT_ID}
