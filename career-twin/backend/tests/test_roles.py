import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.utils.store import save_profile, clear_store
from app.models.profile import CVProfile, Experience, Education
from app.services.role_suggester import _enforce_score_spread
from app.models.analysis import RoleSuggestion

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
    assert len(data["roles"]) >= 3
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


def test_expand_project_returns_all_fields():
    profile_id = save_profile(SAMPLE_PROFILE)
    resp = client.post(
        "/expand-project",
        json={
            "profile_id": profile_id,
            "role": "ML Engineer",
            "project_name": "Sentiment Analysis API",
            "short_description": "Build a REST API that classifies text sentiment",
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    for field in ["name", "short_description", "difficulty", "uniqueness", "duration",
                  "description", "objectives", "tools_required"]:
        assert field in data, f"Missing field: {field}"
    assert 1 <= data["difficulty"] <= 5
    assert 1 <= data["uniqueness"] <= 5
    assert isinstance(data["tools_required"], list)
    assert len(data["tools_required"]) >= 3


def test_expand_project_404_on_unknown_profile():
    resp = client.post(
        "/expand-project",
        json={
            "profile_id": "does-not-exist",
            "role": "ML Engineer",
            "project_name": "Sentiment API",
            "short_description": "Classify text",
        },
    )
    assert resp.status_code == 404


# --- _enforce_score_spread unit tests ---

def _make_roles(scores: list[int]) -> list[RoleSuggestion]:
    """Helper: build minimal RoleSuggestion list from a score list."""
    return [
        RoleSuggestion(
            id=f"role_{i}",
            title=f"Role {i}",
            short_description="desc",
            preview_match_score=s,
            skills=[],
        )
        for i, s in enumerate(scores)
    ]


def test_enforce_spread_no_change_when_already_distinct():
    roles = _make_roles([75, 65, 55, 45, 35])
    result = _enforce_score_spread(roles)
    scores = [r.preview_match_score for r in result]
    assert scores == [75, 65, 55, 45, 35]


def test_enforce_spread_fixes_tied_scores():
    roles = _make_roles([56, 56, 56, 56, 56])
    result = _enforce_score_spread(roles)
    scores = [r.preview_match_score for r in result]
    # All must be unique
    assert len(set(scores)) == 5
    # Adjacent pairs must differ by >= 5
    for a, b in zip(scores, scores[1:]):
        assert a - b >= 5, f"Adjacent scores too close: {a} and {b}"


def test_enforce_spread_fixes_near_ties():
    # Gap of 3 between first two — too close
    roles = _make_roles([70, 67, 55, 45, 35])
    result = _enforce_score_spread(roles)
    scores = [r.preview_match_score for r in result]
    assert scores[0] - scores[1] >= 5


def test_enforce_spread_result_sorted_descending():
    roles = _make_roles([56, 56, 61, 56, 56])
    result = _enforce_score_spread(roles)
    scores = [r.preview_match_score for r in result]
    assert scores == sorted(scores, reverse=True)


def test_enforce_spread_clamps_to_minimum_10():
    # Force scores so low that spreading would push below 0
    roles = _make_roles([20, 18, 16, 14, 12])
    result = _enforce_score_spread(roles)
    scores = [r.preview_match_score for r in result]
    assert all(s >= 10 for s in scores)


def test_suggest_roles_mock_returns_unique_scores():
    """Integration: mock path must also return unique scores."""
    profile_id = save_profile(SAMPLE_PROFILE)
    resp = client.post("/suggest-roles", json={"profile_id": profile_id})
    assert resp.status_code == 200
    scores = [r["preview_match_score"] for r in resp.json()["roles"]]
    assert len(set(scores)) == len(scores), f"Duplicate scores found: {scores}"
