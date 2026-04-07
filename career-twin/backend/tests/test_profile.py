import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.utils.store import clear_store

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_store():
    yield
    clear_store()


VALID_PROFILE = {
    "name": "Alice Smith",
    "headline": "Software Engineer",
    "summary": "Experienced developer",
    "raw_text": "Alice Smith Software Engineer",
    "experience": [
        {"title": "Engineer", "company": "Acme", "duration": "2022–2024", "description": "Built stuff"}
    ],
    "education": [
        {"degree": "BSc CS", "institution": "State U", "year": "2022"}
    ],
    "skills": ["Python", "SQL"],
    "projects": [],
    "certificates": [],
    "leadership": [],
}


def test_confirm_valid_profile_returns_profile_id():
    resp = client.post("/confirm-profile", json=VALID_PROFILE)
    assert resp.status_code == 200
    data = resp.json()
    assert "profile_id" in data
    assert len(data["profile_id"]) > 0


def test_confirm_profile_id_is_unique():
    resp1 = client.post("/confirm-profile", json=VALID_PROFILE)
    resp2 = client.post("/confirm-profile", json=VALID_PROFILE)
    assert resp1.json()["profile_id"] != resp2.json()["profile_id"]


def test_confirm_minimal_profile_uses_defaults():
    resp = client.post("/confirm-profile", json={"headline": "Engineer"})
    assert resp.status_code == 200
    data = resp.json()
    assert "profile_id" in data
