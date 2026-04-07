import io
import fitz
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.utils.store import clear_store


@pytest.fixture(autouse=True)
def reset_store():
    yield
    clear_store()


client = TestClient(app)


def _make_pdf(text: str) -> bytes:
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((72, 72), text)
    return doc.tobytes()


def test_upload_valid_pdf_returns_structured():
    pdf = _make_pdf("Alice Smith\nSoftware Engineer\nSkills: Python, SQL")
    resp = client.post(
        "/upload-cv",
        files={"file": ("resume.pdf", io.BytesIO(pdf), "application/pdf")},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "raw_text" in data
    assert "structured" in data
    assert isinstance(data["structured"]["skills"], list)


def test_upload_invalid_file_type_returns_422():
    resp = client.post(
        "/upload-cv",
        files={"file": ("photo.png", io.BytesIO(b"fake"), "image/png")},
    )
    assert resp.status_code == 422


def test_upload_empty_pdf_returns_200_with_empty_text():
    doc = fitz.open()
    doc.new_page()
    empty_pdf = doc.tobytes()
    resp = client.post(
        "/upload-cv",
        files={"file": ("blank.pdf", io.BytesIO(empty_pdf), "application/pdf")},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data["raw_text"], str)
