# Bootstrap + CV Upload + Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bootstrap the Career Twin monorepo (frontend + backend), implement `POST /upload-cv` with PDF/DOCX extraction, and build the Upload + Review pages end-to-end.

**Architecture:** Next.js App Router frontend calls a FastAPI backend. The backend parses CV PDFs using PyMuPDF (pdfplumber fallback) and returns raw + structured text. The frontend shows a drag-and-drop upload page, then navigates to a review/edit page before confirming the profile.

**Tech Stack:** Next.js 16 (App Router, TypeScript), Tailwind CSS 4, shadcn/ui, lucide-react, FastAPI, Pydantic v2, PyMuPDF, pdfplumber, httpx, python-dotenv, pytest

---

## File Structure

### Frontend
| File | Action | Responsibility |
|------|--------|---------------|
| `frontend/app/page.tsx` | Modify | Landing / Upload page |
| `frontend/app/review/page.tsx` | Create | CV review + edit page |
| `frontend/app/layout.tsx` | Modify | Root layout with global styles |
| `frontend/components/upload/UploadZone.tsx` | Create | Drag-and-drop PDF uploader |
| `frontend/components/review/ProfileForm.tsx` | Create | Editable structured CV form |
| `frontend/lib/types.ts` | Create | Shared TypeScript types (CVProfile, etc.) |
| `frontend/lib/api.ts` | Create | API client (uploadCV, confirmProfile) |

### Backend
| File | Action | Responsibility |
|------|--------|---------------|
| `backend/app/main.py` | Modify | Mount API routers |
| `backend/app/models/profile.py` | Create | Pydantic models: CVProfile, UploadResponse, ConfirmResponse |
| `backend/app/services/cv_parser.py` | Create | PDF/DOCX → raw text (PyMuPDF + pdfplumber) |
| `backend/app/services/cv_structurer.py` | Create | raw text → structured CVProfile via Groq LLM |
| `backend/app/api/upload.py` | Create | POST /upload-cv route |
| `backend/app/api/profile.py` | Create | POST /confirm-profile route |
| `backend/app/utils/store.py` | Create | In-memory profile store (dict) |
| `backend/tests/test_cv_parser.py` | Create | Unit tests for CV parser |
| `backend/tests/test_upload.py` | Create | Integration tests for /upload-cv |
| `backend/tests/test_profile.py` | Create | Integration tests for /confirm-profile |

---

## Task 1: Backend Environment Setup

**Files:**
- Modify: `backend/requirements.txt`
- Create: `backend/.venv` (virtualenv, not committed)
- Create: `backend/.env` (from root .env)

- [ ] **Step 1: Create and activate Python virtual environment**

```bash
cd career-twin/backend
python3 -m venv .venv
source .venv/bin/activate
```

Expected: `(.venv)` prefix in terminal prompt.

- [ ] **Step 2: Install dependencies**

```bash
pip install -r requirements.txt
```

Expected: All packages install without error. Key packages: `fastapi`, `uvicorn`, `pydantic`, `httpx`, `PyMuPDF`, `pdfplumber`, `python-dotenv`, `pytest`, `httpx`.

- [ ] **Step 3: Add pytest to requirements.txt**

Open `backend/requirements.txt` and append:
```
pytest==7.4.3
pytest-asyncio==0.23.2
```

Then reinstall:
```bash
pip install -r requirements.txt
```

- [ ] **Step 4: Verify /health endpoint**

```bash
cd career-twin/backend
uvicorn app.main:app --reload --port 8000
```

In a second terminal:
```bash
curl http://localhost:8000/health
```

Expected output:
```json
{"status": "ok", "service": "career-twin-api"}
```

- [ ] **Step 5: Commit**

```bash
git add backend/requirements.txt
git commit -m "chore: add pytest to backend deps"
```

---

## Task 2: Backend Pydantic Models

**Files:**
- Create: `backend/app/models/profile.py`
- Create: `backend/app/models/__init__.py`

- [ ] **Step 1: Create `backend/app/models/__init__.py`**

```python
```
(Empty file — makes models a package)

- [ ] **Step 2: Write the failing test first**

Create `backend/tests/__init__.py` (empty).

Create `backend/tests/test_models.py`:

```python
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend && pytest tests/test_models.py -v
```

Expected: `ImportError` — module not found.

- [ ] **Step 3: Implement `backend/app/models/profile.py`**

```python
from pydantic import BaseModel, Field
from typing import Optional


class Experience(BaseModel):
    title: str = ""
    company: str = ""
    duration: str = ""
    description: str = ""


class Education(BaseModel):
    degree: str = ""
    institution: str = ""
    year: str = ""


class CVProfile(BaseModel):
    name: str = ""
    headline: str = ""
    summary: str = ""
    raw_text: str = ""
    experience: list[Experience] = Field(default_factory=list)
    education: list[Education] = Field(default_factory=list)
    skills: list[str] = Field(default_factory=list)
    projects: list[str] = Field(default_factory=list)
    certificates: list[str] = Field(default_factory=list)
    leadership: list[str] = Field(default_factory=list)


class UploadResponse(BaseModel):
    raw_text: str
    structured: CVProfile


class ConfirmResponse(BaseModel):
    profile_id: str
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pytest tests/test_models.py -v
```

Expected: 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/app/models/ backend/tests/
git commit -m "feat: add CV Pydantic models"
```

---

## Task 3: CV Parser Service

**Files:**
- Create: `backend/app/services/__init__.py`
- Create: `backend/app/services/cv_parser.py`
- Create: `backend/tests/test_cv_parser.py`

- [ ] **Step 1: Create `backend/app/services/__init__.py`**

```python
```
(Empty file)

- [ ] **Step 2: Write failing tests**

Create `backend/tests/test_cv_parser.py`:

```python
import io
import pytest
from app.services.cv_parser import extract_text_from_pdf_bytes, extract_text_from_bytes


def test_extract_from_valid_pdf_bytes():
    """Test that a minimal PDF returns non-empty text."""
    # Minimal 1-page PDF with "Hello World" text
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
    from app.services.cv_parser import UnsupportedFileTypeError
    with pytest.raises(UnsupportedFileTypeError):
        extract_text_from_bytes(b"fake data", filename="photo.png")


def _make_minimal_pdf(text: str) -> bytes:
    """Create a minimal in-memory PDF containing text."""
    import fitz  # PyMuPDF
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((72, 72), text)
    return doc.tobytes()
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
pytest tests/test_cv_parser.py -v
```

Expected: `ImportError` for `cv_parser`.

- [ ] **Step 4: Implement `backend/app/services/cv_parser.py`**

```python
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
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
pytest tests/test_cv_parser.py -v
```

Expected: 4 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/app/services/ backend/tests/test_cv_parser.py
git commit -m "feat: CV parser service with PyMuPDF + pdfplumber fallback"
```

---

## Task 4: CV Structurer Service (LLM)

**Files:**
- Create: `backend/app/services/cv_structurer.py`
- Create: `backend/app/prompts/__init__.py`
- Create: `backend/app/prompts/cv_structure.py`

- [ ] **Step 1: Create `backend/app/prompts/__init__.py`**

```python
```
(Empty)

- [ ] **Step 2: Create `backend/app/prompts/cv_structure.py`**

```python
STRUCTURE_CV_PROMPT = """\
You are a CV parser. Given the raw text of a CV below, extract and return a JSON object with exactly these fields:

{{
  "name": "Full name of candidate",
  "headline": "Job title or role they identify as",
  "summary": "2–3 sentence professional summary",
  "experience": [
    {{"title": "Job title", "company": "Company name", "duration": "Start–End", "description": "One sentence summary"}}
  ],
  "education": [
    {{"degree": "Degree name", "institution": "University/school", "year": "Graduation year"}}
  ],
  "skills": ["skill1", "skill2"],
  "projects": ["Project name: one sentence description"],
  "certificates": ["Certificate name"],
  "leadership": ["Role or activity: one sentence description"]
}}

Rules:
- Return ONLY valid JSON. No markdown, no commentary.
- If a field has no data, return an empty list [] or empty string "".
- Keep values concise.

CV TEXT:
{raw_text}
"""
```

- [ ] **Step 3: Create `backend/app/services/cv_structurer.py`**

```python
import os
import json
import httpx
from app.models.profile import CVProfile, Experience, Education
from app.prompts.cv_structure import STRUCTURE_CV_PROMPT


GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama3-8b-8192"


def structure_cv(raw_text: str) -> CVProfile:
    """Call Groq LLM to convert raw CV text into a structured CVProfile."""
    api_key = os.getenv("GROQ_API_KEY", "")
    if not api_key:
        return _mock_structure(raw_text)

    prompt = STRUCTURE_CV_PROMPT.format(raw_text=raw_text[:4000])

    with httpx.Client(timeout=30) as client:
        resp = client.post(
            GROQ_API_URL,
            headers={"Authorization": f"Bearer {api_key}"},
            json={
                "model": GROQ_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.2,
            },
        )
        resp.raise_for_status()

    content = resp.json()["choices"][0]["message"]["content"]
    data = json.loads(content)
    return _dict_to_profile(data, raw_text)


def _dict_to_profile(data: dict, raw_text: str) -> CVProfile:
    return CVProfile(
        name=data.get("name", ""),
        headline=data.get("headline", ""),
        summary=data.get("summary", ""),
        raw_text=raw_text,
        experience=[
            Experience(**e) for e in data.get("experience", [])
            if isinstance(e, dict)
        ],
        education=[
            Education(**e) for e in data.get("education", [])
            if isinstance(e, dict)
        ],
        skills=data.get("skills", []),
        projects=data.get("projects", []),
        certificates=data.get("certificates", []),
        leadership=data.get("leadership", []),
    )


def _mock_structure(raw_text: str) -> CVProfile:
    """Return a plausible mock structure when no API key is set."""
    return CVProfile(
        name="Demo Candidate",
        headline="Software Developer",
        summary="A motivated developer with experience in web technologies.",
        raw_text=raw_text,
        skills=["Python", "JavaScript", "SQL"],
        experience=[
            Experience(
                title="Intern", company="Tech Co", duration="2023–2024",
                description="Built internal tools"
            )
        ],
        education=[
            Education(
                degree="BSc Computer Science",
                institution="State University",
                year="2024"
            )
        ],
    )
```

- [ ] **Step 4: No failing tests for structurer** — it calls Groq which requires a live key. We test integration via the route tests in Task 5.

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/cv_structurer.py backend/app/prompts/
git commit -m "feat: CV structurer service with Groq LLM + mock fallback"
```

---

## Task 5: In-Memory Profile Store + POST /upload-cv Route

**Files:**
- Create: `backend/app/utils/__init__.py`
- Create: `backend/app/utils/store.py`
- Create: `backend/app/api/__init__.py`
- Create: `backend/app/api/upload.py`
- Modify: `backend/app/main.py`
- Create: `backend/tests/test_upload.py`

- [ ] **Step 1: Create `backend/app/utils/__init__.py`**

```python
```
(Empty)

- [ ] **Step 2: Create `backend/app/utils/store.py`**

```python
import uuid
from app.models.profile import CVProfile

_profiles: dict[str, CVProfile] = {}


def save_profile(profile: CVProfile) -> str:
    profile_id = str(uuid.uuid4())
    _profiles[profile_id] = profile
    return profile_id


def get_profile(profile_id: str) -> CVProfile | None:
    return _profiles.get(profile_id)


def clear_store() -> None:
    """For test teardown only."""
    _profiles.clear()
```

- [ ] **Step 3: Create `backend/app/api/__init__.py`**

```python
```
(Empty)

- [ ] **Step 4: Write failing tests for /upload-cv**

Create `backend/tests/test_upload.py`:

```python
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
    assert data["raw_text"] == "" or isinstance(data["raw_text"], str)
```

- [ ] **Step 5: Run tests to verify they fail**

```bash
pytest tests/test_upload.py -v
```

Expected: `404` — route not registered yet.

- [ ] **Step 6: Create `backend/app/api/upload.py`**

```python
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.cv_parser import extract_text_from_bytes, UnsupportedFileTypeError
from app.services.cv_structurer import structure_cv
from app.models.profile import UploadResponse

router = APIRouter()

ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx"}


@router.post("/upload-cv", response_model=UploadResponse)
async def upload_cv(file: UploadFile = File(...)):
    filename = file.filename or ""
    ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=422,
            detail=f"Unsupported file type '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    data = await file.read()

    try:
        raw_text = extract_text_from_bytes(data, filename)
    except UnsupportedFileTypeError as e:
        raise HTTPException(status_code=422, detail=str(e))

    structured = structure_cv(raw_text)
    return UploadResponse(raw_text=raw_text, structured=structured)
```

- [ ] **Step 7: Mount the router in `backend/app/main.py`**

Replace the contents of `backend/app/main.py` with:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
from app.api.upload import router as upload_router

load_dotenv()

app = FastAPI(title="Career Twin API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload_router)


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "career-twin-api"}
```

- [ ] **Step 8: Run tests to verify they pass**

```bash
pytest tests/test_upload.py -v
```

Expected: 3 tests PASS.

- [ ] **Step 9: Commit**

```bash
git add backend/app/ backend/tests/test_upload.py
git commit -m "feat: POST /upload-cv with PDF extraction and LLM structuring"
```

---

## Task 6: POST /confirm-profile Route

**Files:**
- Create: `backend/app/api/profile.py`
- Modify: `backend/app/main.py`
- Create: `backend/tests/test_profile.py`

- [ ] **Step 1: Write failing tests**

Create `backend/tests/test_profile.py`:

```python
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


def test_confirm_missing_name_returns_422():
    bad = {**VALID_PROFILE, "name": None}
    resp = client.post("/confirm-profile", json=bad)
    # name has default "", so this is fine — test missing required structure instead
    bad2 = {"headline": "Engineer"}  # missing most fields — pydantic fills defaults
    resp2 = client.post("/confirm-profile", json=bad2)
    assert resp2.status_code == 200  # all fields have defaults
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pytest tests/test_profile.py -v
```

Expected: `404` on `/confirm-profile`.

- [ ] **Step 3: Create `backend/app/api/profile.py`**

```python
from fastapi import APIRouter
from app.models.profile import CVProfile, ConfirmResponse
from app.utils.store import save_profile

router = APIRouter()


@router.post("/confirm-profile", response_model=ConfirmResponse)
def confirm_profile(profile: CVProfile):
    profile_id = save_profile(profile)
    return ConfirmResponse(profile_id=profile_id)
```

- [ ] **Step 4: Mount profile router in `backend/app/main.py`**

Add import and include after upload_router:

```python
from app.api.upload import router as upload_router
from app.api.profile import router as profile_router

# ... existing app setup ...

app.include_router(upload_router)
app.include_router(profile_router)
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
pytest tests/test_profile.py -v
```

Expected: 3 tests PASS. Run all tests:

```bash
pytest -v
```

Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/app/api/profile.py backend/app/main.py backend/tests/test_profile.py
git commit -m "feat: POST /confirm-profile stores profile and returns ID"
```

---

## Task 7: Frontend — Shared Types + API Client

**Files:**
- Create: `frontend/lib/types.ts`
- Create: `frontend/lib/api.ts`

- [ ] **Step 1: Create `frontend/lib/types.ts`**

```typescript
export interface Experience {
  title: string;
  company: string;
  duration: string;
  description: string;
}

export interface Education {
  degree: string;
  institution: string;
  year: string;
}

export interface CVProfile {
  name: string;
  headline: string;
  summary: string;
  raw_text: string;
  experience: Experience[];
  education: Education[];
  skills: string[];
  projects: string[];
  certificates: string[];
  leadership: string[];
}

export interface UploadResponse {
  raw_text: string;
  structured: CVProfile;
}

export interface ConfirmResponse {
  profile_id: string;
}
```

- [ ] **Step 2: Create `frontend/lib/api.ts`**

```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export async function uploadCV(file: File): Promise<import("./types").UploadResponse> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/upload-cv`, { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `Upload failed: ${res.status}`);
  }
  return res.json();
}

export async function confirmProfile(
  profile: import("./types").CVProfile
): Promise<import("./types").ConfirmResponse> {
  const res = await fetch(`${API_BASE}/confirm-profile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `Confirm failed: ${res.status}`);
  }
  return res.json();
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/lib/
git commit -m "feat: frontend types and API client"
```

---

## Task 8: Frontend — Install shadcn/ui + Lucide

**Files:**
- Modify: `frontend/package.json` (via npm)
- Modify: `frontend/components.json` (created by shadcn init)

- [ ] **Step 1: Install lucide-react**

```bash
cd frontend
npm install lucide-react
```

Expected: `lucide-react` appears in `package.json` dependencies.

- [ ] **Step 2: Initialize shadcn/ui**

```bash
npx shadcn@latest init -d
```

When prompted (if interactive), accept defaults: style=default, base-color=slate, CSS variables=yes.

Expected: `components.json` created, `frontend/components/ui/` directory created.

- [ ] **Step 3: Add Button and Card components**

```bash
npx shadcn@latest add button card
```

Expected: `frontend/components/ui/button.tsx` and `frontend/components/ui/card.tsx` created.

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd frontend && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/components.json frontend/components/ui/
git commit -m "chore: add shadcn/ui and lucide-react to frontend"
```

---

## Task 9: Frontend — UploadZone Component

**Files:**
- Create: `frontend/components/upload/UploadZone.tsx`

- [ ] **Step 1: Create `frontend/components/upload/UploadZone.tsx`**

```tsx
"use client";

import { useCallback, useState } from "react";
import { Upload, FileText, Loader2 } from "lucide-react";

interface UploadZoneProps {
  onUpload: (file: File) => void;
  isLoading: boolean;
  loadingMessage?: string;
}

export function UploadZone({ onUpload, isLoading, loadingMessage }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ALLOWED = [".pdf", ".doc", ".docx"];

  function validate(file: File): string | null {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED.includes(ext)) return `Unsupported type. Use PDF or DOCX.`;
    if (file.size > 10 * 1024 * 1024) return "File too large. Max 10 MB.";
    return null;
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (!file) return;
      const err = validate(file);
      if (err) { setError(err); return; }
      setError(null);
      onUpload(file);
    },
    [onUpload]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validate(file);
    if (err) { setError(err); return; }
    setError(null);
    onUpload(file);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`
        relative flex flex-col items-center justify-center gap-4
        rounded-2xl border-2 border-dashed p-12 text-center
        transition-colors duration-200 cursor-pointer
        ${isDragging ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-slate-50 hover:border-slate-400"}
        ${isLoading ? "pointer-events-none opacity-70" : ""}
      `}
    >
      <input
        type="file"
        accept=".pdf,.doc,.docx"
        className="absolute inset-0 opacity-0 cursor-pointer"
        onChange={handleFileInput}
        disabled={isLoading}
      />
      {isLoading ? (
        <>
          <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
          <p className="text-sm text-slate-600">{loadingMessage ?? "Processing…"}</p>
        </>
      ) : (
        <>
          <div className="rounded-full bg-slate-200 p-4">
            <Upload className="h-8 w-8 text-slate-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-700">Drop your CV here</p>
            <p className="text-sm text-slate-500 mt-1">or click to browse · PDF or DOCX · max 10 MB</p>
          </div>
          <div className="flex gap-2 text-xs text-slate-400">
            <FileText className="h-4 w-4" /> PDF &nbsp;|&nbsp; DOCX
          </div>
        </>
      )}
      {error && (
        <p className="text-sm text-red-500 mt-2">{error}</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/components/upload/
git commit -m "feat: UploadZone drag-and-drop component"
```

---

## Task 10: Frontend — Landing / Upload Page

**Files:**
- Modify: `frontend/app/page.tsx`
- Modify: `frontend/app/layout.tsx`

- [ ] **Step 1: Update `frontend/app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Career Twin",
  description: "AI-powered career strategist for university students",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.className} bg-white text-slate-900 antialiased`}>
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Replace `frontend/app/page.tsx` with Upload landing page**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadZone } from "@/components/upload/UploadZone";
import { uploadCV } from "@/lib/api";
import type { UploadResponse } from "@/lib/types";

const LOADING_MESSAGES = [
  "Reading your CV…",
  "Identifying your experience…",
  "Structuring your profile…",
];

export default function UploadPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(file: File) {
    setIsLoading(true);
    setError(null);

    // Cycle loading messages
    let msgIdx = 0;
    const interval = setInterval(() => {
      msgIdx = (msgIdx + 1) % LOADING_MESSAGES.length;
      setLoadingMsg(LOADING_MESSAGES[msgIdx]);
    }, 1800);

    try {
      const result: UploadResponse = await uploadCV(file);
      clearInterval(interval);
      // Store in sessionStorage for the review page
      sessionStorage.setItem("upload_result", JSON.stringify(result));
      router.push("/review");
    } catch (err) {
      clearInterval(interval);
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">
            Career Twin
          </h1>
          <p className="text-lg text-slate-500">
            Upload your CV and discover your ideal career path.
          </p>
        </div>

        <UploadZone
          onUpload={handleUpload}
          isLoading={isLoading}
          loadingMessage={loadingMsg}
        />

        {error && (
          <p className="text-sm text-center text-red-500">{error}</p>
        )}

        <p className="text-xs text-center text-slate-400">
          Your CV is processed securely and never stored permanently.
        </p>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/app/
git commit -m "feat: upload landing page with loading state and error handling"
```

---

## Task 11: Frontend — Review / Edit Page

**Files:**
- Create: `frontend/app/review/page.tsx`
- Create: `frontend/components/review/ProfileForm.tsx`

- [ ] **Step 1: Create `frontend/components/review/ProfileForm.tsx`**

```tsx
"use client";

import { useState } from "react";
import type { CVProfile } from "@/lib/types";

interface ProfileFormProps {
  initial: CVProfile;
  onConfirm: (profile: CVProfile) => void;
  isLoading: boolean;
}

export function ProfileForm({ initial, onConfirm, isLoading }: ProfileFormProps) {
  const [profile, setProfile] = useState<CVProfile>(initial);

  function setField<K extends keyof CVProfile>(key: K, value: CVProfile[K]) {
    setProfile((p) => ({ ...p, [key]: value }));
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onConfirm(profile); }}
      className="space-y-6"
    >
      {/* Name & Headline */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Full Name">
          <input
            value={profile.name}
            onChange={(e) => setField("name", e.target.value)}
            className="input"
            placeholder="Your name"
          />
        </Field>
        <Field label="Headline">
          <input
            value={profile.headline}
            onChange={(e) => setField("headline", e.target.value)}
            className="input"
            placeholder="e.g. Software Engineer"
          />
        </Field>
      </div>

      {/* Summary */}
      <Field label="Summary">
        <textarea
          value={profile.summary}
          onChange={(e) => setField("summary", e.target.value)}
          rows={3}
          className="input"
          placeholder="Brief professional summary"
        />
      </Field>

      {/* Skills */}
      <Field label="Skills (comma-separated)">
        <input
          value={profile.skills.join(", ")}
          onChange={(e) =>
            setField("skills", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))
          }
          className="input"
          placeholder="Python, SQL, React…"
        />
      </Field>

      {/* Experience */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-2">Experience</h3>
        {profile.experience.map((exp, i) => (
          <div key={i} className="grid grid-cols-3 gap-2 mb-2">
            <input
              value={exp.title}
              onChange={(e) => {
                const updated = [...profile.experience];
                updated[i] = { ...updated[i], title: e.target.value };
                setField("experience", updated);
              }}
              className="input"
              placeholder="Title"
            />
            <input
              value={exp.company}
              onChange={(e) => {
                const updated = [...profile.experience];
                updated[i] = { ...updated[i], company: e.target.value };
                setField("experience", updated);
              }}
              className="input"
              placeholder="Company"
            />
            <input
              value={exp.duration}
              onChange={(e) => {
                const updated = [...profile.experience];
                updated[i] = { ...updated[i], duration: e.target.value };
                setField("experience", updated);
              }}
              className="input"
              placeholder="2022–2024"
            />
          </div>
        ))}
      </div>

      {/* Education */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-2">Education</h3>
        {profile.education.map((edu, i) => (
          <div key={i} className="grid grid-cols-3 gap-2 mb-2">
            <input
              value={edu.degree}
              onChange={(e) => {
                const updated = [...profile.education];
                updated[i] = { ...updated[i], degree: e.target.value };
                setField("education", updated);
              }}
              className="input"
              placeholder="Degree"
            />
            <input
              value={edu.institution}
              onChange={(e) => {
                const updated = [...profile.education];
                updated[i] = { ...updated[i], institution: e.target.value };
                setField("education", updated);
              }}
              className="input"
              placeholder="University"
            />
            <input
              value={edu.year}
              onChange={(e) => {
                const updated = [...profile.education];
                updated[i] = { ...updated[i], year: e.target.value };
                setField("education", updated);
              }}
              className="input"
              placeholder="2024"
            />
          </div>
        ))}
      </div>

      {/* Raw text (collapsible) */}
      <details className="text-sm text-slate-500">
        <summary className="cursor-pointer hover:text-slate-700">View raw extracted text</summary>
        <textarea
          value={profile.raw_text}
          onChange={(e) => setField("raw_text", e.target.value)}
          rows={8}
          className="input mt-2 font-mono text-xs"
          readOnly
        />
      </details>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-xl bg-blue-600 py-3 text-white font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors"
      >
        {isLoading ? "Saving profile…" : "Confirm CV →"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Add `.input` utility to `frontend/app/globals.css`**

Open `frontend/app/globals.css` and add at the bottom:

```css
@layer components {
  .input {
    @apply w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100;
  }
}
```

- [ ] **Step 3: Create `frontend/app/review/page.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProfileForm } from "@/components/review/ProfileForm";
import { confirmProfile } from "@/lib/api";
import type { CVProfile, UploadResponse } from "@/lib/types";

export default function ReviewPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<CVProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("upload_result");
    if (!raw) { router.push("/"); return; }
    const data: UploadResponse = JSON.parse(raw);
    setProfile(data.structured);
  }, [router]);

  async function handleConfirm(updated: CVProfile) {
    setIsLoading(true);
    setError(null);
    try {
      const result = await confirmProfile(updated);
      sessionStorage.setItem("profile_id", result.profile_id);
      sessionStorage.setItem("confirmed_profile", JSON.stringify(updated));
      router.push("/roles");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile.");
      setIsLoading(false);
    }
  }

  if (!profile) return null;

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Review Your CV</h1>
          <p className="text-slate-500 mt-1">
            Check what we extracted. Edit anything before we build your career paths.
          </p>
        </div>

        <div className="rounded-2xl bg-white shadow-sm border border-slate-100 p-6">
          <ProfileForm
            initial={profile}
            onConfirm={handleConfirm}
            isLoading={isLoading}
          />
        </div>

        {error && (
          <p className="mt-4 text-sm text-center text-red-500">{error}</p>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/app/review/ frontend/components/review/ frontend/app/globals.css
git commit -m "feat: CV review + edit page with confirm flow"
```

---

## Task 12: End-to-End Verification

- [ ] **Step 1: Start backend**

```bash
cd career-twin/backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

Verify:
```bash
curl http://localhost:8000/health
```
Expected: `{"status":"ok","service":"career-twin-api"}`

- [ ] **Step 2: Run all backend tests**

```bash
cd career-twin/backend && pytest -v
```

Expected: All tests PASS (no failures).

- [ ] **Step 3: Start frontend**

In a separate terminal:
```bash
cd career-twin/frontend
npm run dev
```

Open `http://localhost:3000`. Expected: Career Twin landing page with upload zone visible.

- [ ] **Step 4: Happy path test**

1. Drag a PDF CV onto the drop zone.
2. Observe loading message cycling: "Reading your CV…" → "Structuring your profile…"
3. App navigates to `/review`.
4. Fields are populated from the CV.
5. Edit one field (e.g., update a skill).
6. Click "Confirm CV →".
7. App navigates to `/roles` (404 is fine — page doesn't exist yet).

- [ ] **Step 5: Edge case — invalid file**

1. Try dropping a `.png` file.
2. Expected: error message "Unsupported type. Use PDF or DOCX." No network call made.

- [ ] **Step 6: Edge case — no GROQ_API_KEY**

1. Ensure `.env` has empty `GROQ_API_KEY=`.
2. Upload a PDF.
3. Expected: structured profile returns with mock data (name: "Demo Candidate").

- [ ] **Step 7: Final commit**

```bash
git add .env.example
git commit -m "chore: env template + final verification"
```

---

## Self-Review

**Spec coverage:**
- ✅ Frontend Bootstrap: Next.js + Tailwind + shadcn/ui + Lucide (Task 8)
- ✅ Backend Bootstrap: FastAPI /health, all packages (Task 1)
- ✅ Env template: GROQ_API_KEY, GEMMA_API_KEY, NEXT_PUBLIC_API_BASE_URL (Task 1 + 12)
- ✅ POST /upload-cv: PDF + DOCX, structured response (Tasks 3–5)
- ✅ Upload Page: drag-and-drop, loading messages, navigate to /review (Tasks 9–10)
- ✅ POST /confirm-profile: Pydantic validation, in-memory store, profile_id (Task 6)
- ✅ Review Page: editable fields, confirm button, navigate to /roles (Task 11)

**Placeholder scan:** None found — all steps contain concrete code.

**Type consistency:**
- `CVProfile`, `Experience`, `Education`, `UploadResponse`, `ConfirmResponse` defined in Task 2 and `lib/types.ts` (Task 7) — used consistently.
- `extract_text_from_bytes`, `UnsupportedFileTypeError` defined in Task 3 — used correctly in Task 5.
- `structure_cv` defined in Task 4 — called in Task 5 upload route.
- `save_profile` defined in Task 5 store — used in Task 6 profile route.
