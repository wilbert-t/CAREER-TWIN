from app.models.profile import (
    Experience, Education, CVProfile, UploadResponse, ConfirmResponse
)


def test_cv_profile_defaults():
    profile = CVProfile(name="Alice", raw_text="Alice is a developer")
    assert profile.name == "Alice"
    assert profile.skills == []
    assert profile.experience == []
    assert profile.education == []


def test_experience_model():
    exp = Experience(title="Engineer", company="Acme", duration="2022–2024")
    assert exp.title == "Engineer"
    assert exp.company == "Acme"


def test_upload_response_has_profile():
    profile = CVProfile(name="Bob", raw_text="Bob studied CS")
    resp = UploadResponse(raw_text="Bob studied CS", structured=profile)
    assert resp.structured.name == "Bob"


def test_confirm_response_has_id():
    resp = ConfirmResponse(profile_id="abc-123")
    assert resp.profile_id == "abc-123"
