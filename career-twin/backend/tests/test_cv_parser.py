import io
import fitz
import pytest
from app.services.cv_parser import extract_text_from_pdf_bytes, extract_text_from_bytes, UnsupportedFileTypeError


def _make_minimal_pdf(text: str) -> bytes:
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((72, 72), text)
    return doc.tobytes()


def test_extract_from_valid_pdf_bytes():
    pdf_bytes = _make_minimal_pdf("Hello World from CV")
    result = extract_text_from_pdf_bytes(pdf_bytes)
    assert "Hello" in result
    assert len(result) > 5


def test_extract_returns_string():
    pdf_bytes = _make_minimal_pdf("Test content")
    result = extract_text_from_pdf_bytes(pdf_bytes)
    assert isinstance(result, str)


def test_extract_from_bytes_pdf():
    pdf_bytes = _make_minimal_pdf("Alice Engineer")
    result = extract_text_from_bytes(pdf_bytes, filename="resume.pdf")
    assert isinstance(result, str)
    assert len(result) > 0


def test_extract_from_bytes_rejects_unknown_type():
    with pytest.raises(UnsupportedFileTypeError):
        extract_text_from_bytes(b"fake data", filename="photo.png")
