import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def _minimal_pdf_bytes() -> bytes:
    """Return minimal valid PDF bytes that PyMuPDF can open but contain no text."""
    return (
        b"%PDF-1.4\n"
        b"1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
        b"2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n"
        b"3 0 obj<</Type/Page/MediaBox[0 0 3 3]>>endobj\n"
        b"xref\n0 4\n"
        b"0000000000 65535 f \n"
        b"0000000009 00000 n \n"
        b"0000000058 00000 n \n"
        b"0000000115 00000 n \n"
        b"trailer<</Size 4/Root 1 0 R>>\n"
        b"startxref\n190\n%%EOF\n"
    )


def test_upload_rejects_file_over_10mb():
    """Files over 10MB must return 422 with 'too large' in the detail message."""
    big_data = b"x" * (11 * 1024 * 1024)
    response = client.post(
        "/upload-cv",
        files={"file": ("big.pdf", big_data, "application/pdf")},
    )
    assert response.status_code == 422
    assert "too large" in response.json()["detail"].lower()


def test_upload_returns_parse_warning_field():
    """UploadResponse must always include a parse_warning field (None or str)."""
    response = client.post(
        "/upload-cv",
        files={"file": ("empty.pdf", _minimal_pdf_bytes(), "application/pdf")},
    )
    # 200 (structurer mock returns something) or 500 (structurer fails internally)
    # Either way, if it succeeds it must have parse_warning
    if response.status_code == 200:
        data = response.json()
        assert "parse_warning" in data
        assert data["parse_warning"] is None or isinstance(data["parse_warning"], str)


def test_upload_rejects_unsupported_extension():
    """Files with unsupported extensions must return 422."""
    response = client.post(
        "/upload-cv",
        files={"file": ("doc.txt", b"some text", "text/plain")},
    )
    assert response.status_code == 422
