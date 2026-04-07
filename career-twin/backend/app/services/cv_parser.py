import fitz  # PyMuPDF
import pdfplumber
import io


class UnsupportedFileTypeError(ValueError):
    pass


def extract_text_from_pdf_bytes(data: bytes) -> str:
    """Extract text from PDF bytes using PyMuPDF. Falls back to pdfplumber."""
    try:
        doc = fitz.open(stream=data, filetype="pdf")
        text = "\n".join(page.get_text() for page in doc)
        if text.strip():
            return text.strip()
    except Exception:
        pass

    # Fallback: pdfplumber
    with pdfplumber.open(io.BytesIO(data)) as pdf:
        text = "\n".join(
            page.extract_text() or "" for page in pdf.pages
        )
    return text.strip()


def extract_text_from_bytes(data: bytes, filename: str) -> str:
    """Route extraction by file extension."""
    lower = filename.lower()
    if lower.endswith(".pdf"):
        return extract_text_from_pdf_bytes(data)
    if lower.endswith((".doc", ".docx")):
        return _extract_text_from_docx(data)
    raise UnsupportedFileTypeError(f"Unsupported file type: {filename}")


def _extract_text_from_docx(data: bytes) -> str:
    """Extract text from DOCX bytes using python-docx."""
    try:
        import docx
        doc = docx.Document(io.BytesIO(data))
        return "\n".join(para.text for para in doc.paragraphs).strip()
    except ImportError:
        raise UnsupportedFileTypeError(
            "python-docx not installed. Run: pip install python-docx"
        )
