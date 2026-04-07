from fastapi import APIRouter, HTTPException
from app.models.analysis import (
    SuggestRolesRequest,
    SuggestRolesResponse,
    AnalyzeRoleFitRequest,
    AnalyzeRoleFitResponse,
)
from app.services.role_suggester import suggest_roles
from app.services.role_analyzer import analyze_role_fit
from app.utils.store import get_profile

router = APIRouter()


@router.post("/suggest-roles", response_model=SuggestRolesResponse)
def suggest_roles_endpoint(body: SuggestRolesRequest):
    profile = get_profile(body.profile_id)
    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Profile not found. Please upload your CV again.",
        )
    try:
        roles = suggest_roles(profile)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Role suggestion failed: {str(e)}")
    return SuggestRolesResponse(roles=roles)


@router.post("/analyze-role-fit", response_model=AnalyzeRoleFitResponse)
def analyze_role_fit_endpoint(body: AnalyzeRoleFitRequest):
    profile = get_profile(body.profile_id)
    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Profile not found. Please upload your CV again.",
        )
    try:
        result = analyze_role_fit(profile, body.selected_role)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Role analysis failed: {str(e)}")
    return result
