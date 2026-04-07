from fastapi import APIRouter
from app.models.profile import CVProfile, ConfirmResponse
from app.utils.store import save_profile

router = APIRouter()


@router.post("/confirm-profile", response_model=ConfirmResponse)
def confirm_profile(profile: CVProfile):
    profile_id = save_profile(profile)
    return ConfirmResponse(profile_id=profile_id)
