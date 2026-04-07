import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.utils.store import save_profile, clear_store
from app.models.profile import CVProfile, Experience, Education

client = TestClient(app)

SAMPLE_PROFILE = CVProfile(
    name="Jane Doe",
    headline="CS Student",
    summary="Final-year CS student with Python and ML experience.",
    raw_text="Jane Doe\nCS Student\nPython, Machine Learning, Statistics, Git",
    skills=["Python", "Machine Learning", "Statistics"],
    experience=[
        Experience(
            title="Research Assistant",
            company="University Lab",
            duration="2023-2024",
            description="ML research on NLP models",
        )
    ],
    education=[
        Education(degree="BSc Computer Science", institution="State University", year="2024")
    ],
)


@pytest.fixture(autouse=True)
def clean_store():
    clear_store()
    yield
    clear_store()


def test_suggest_roles_returns_three_roles():
    profile_id = save_profile(SAMPLE_PROFILE)
    resp = client.post("/suggest-roles", json={"profile_id": profile_id})
    assert resp.status_code == 200
    data = resp.json()
    assert "roles" in data
    assert len(data["roles"]) == 3
    for role in data["roles"]:
        assert "id" in role
        assert "title" in role
        assert "short_description" in role
        assert isinstance(role["preview_match_score"], int)
        assert 0 <= role["preview_match_score"] <= 100


def test_suggest_roles_404_on_unknown_profile():
    resp = client.post("/suggest-roles", json={"profile_id": "does-not-exist"})
    assert resp.status_code == 404


def test_analyze_role_fit_returns_all_required_fields():
    profile_id = save_profile(SAMPLE_PROFILE)
    resp = client.post(
        "/analyze-role-fit",
        json={"profile_id": profile_id, "selected_role": "ml_engineer"},
    )
    assert resp.status_code == 200
    data = resp.json()
    required = [
        "selected_role", "match_score", "score_breakdown", "strengths",
        "weaknesses", "matched_skills", "missing_skills", "readiness_summary",
        "priority_improvements", "learning_steps", "possible_projects",
        "resume_improvements", "alternative_roles", "goal_pathway", "evidence_items",
    ]
    for field in required:
        assert field in data, f"Missing field: {field}"


def test_analyze_role_fit_accepts_custom_role_text():
    profile_id = save_profile(SAMPLE_PROFILE)
    resp = client.post(
        "/analyze-role-fit",
        json={"profile_id": profile_id, "selected_role": "Product Manager at a startup"},
    )
    assert resp.status_code == 200


def test_analyze_role_fit_404_on_unknown_profile():
    resp = client.post(
        "/analyze-role-fit",
        json={"profile_id": "does-not-exist", "selected_role": "ml_engineer"},
    )
    assert resp.status_code == 404
