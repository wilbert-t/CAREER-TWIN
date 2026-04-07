import uuid
from app.models.profile import CVProfile

_profiles: dict[str, CVProfile] = {}


def save_profile(profile: CVProfile) -> str:
    profile_id = str(uuid.uuid4())
    _profiles[profile_id] = profile
    return profile_id


def get_profile(profile_id: str) -> CVProfile | None:
    return _profiles.get(profile_id)


def clear_store() -> None:
    """For test teardown only."""
    _profiles.clear()
