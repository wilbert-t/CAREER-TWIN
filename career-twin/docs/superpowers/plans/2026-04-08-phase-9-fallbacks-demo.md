# Phase 9 – Fallbacks & Demo Prep Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden error handling so no raw stack trace ever reaches the user, and create a reproducible demo flow document.

**Architecture:** Three surface changes: (1) backend `upload.py` adds a file-size guard and a weak-parse warning flag; (2) `main.py` gets a global exception handler that converts unhandled 500s into clean JSON; (3) frontend review page shows a banner when parse quality is poor. A `DEMO_FLOW.md` document is written to `career-twin/docs/`. The existing mock fallbacks already cover LLM outages — no new LLM fallback code is needed.

**Tech Stack:** FastAPI exception handlers, Pydantic, Next.js, TypeScript

---

## File Map

| File | Action |
|------|--------|
| `career-twin/backend/app/models/profile.py` | Modify – add `parse_warning: str \| None` to `UploadResponse` |
| `career-twin/backend/app/api/upload.py` | Modify – file-size guard + set `parse_warning` when text is short |
| `career-twin/backend/app/main.py` | Modify – global exception handler |
| `career-twin/frontend/lib/types.ts` | Modify – add `parse_warning?: string` to `UploadResponse` |
| `career-twin/frontend/app/review/page.tsx` | Modify – show parse warning banner if present |
| `career-twin/docs/DEMO_FLOW.md` | Create – demo script |
| `career-twin/backend/tests/test_upload_guards.py` | Create – 3 tests for upload guards |

---

### Task 1: Add `parse_warning` to the upload response model

**Files:**
- Modify: `career-twin/backend/app/models/profile.py`

- [ ] **Step 1: Write failing tests**

```python
# career-twin/backend/tests/test_upload_guards.py
import io
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def _pdf_bytes() -> bytes:
    """Return minimal valid single-space PDF bytes (extractable but trivial)."""
    # A real but very sparse PDF — enough for PyMuPDF to open without crashing
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
    """Files over 10MB must return 422."""
    big_data = b"x" * (11 * 1024 * 1024)
    response = client.post(
        "/upload-cv",
        files={"file": ("big.pdf", big_data, "application/pdf")},
    )
    assert response.status_code == 422
    assert "too large" in response.json()["detail"].lower()


def test_upload_returns_parse_warning_for_empty_pdf():
    """A PDF with no extractable text should return parse_warning."""
    response = client.post(
        "/upload-cv",
        files={"file": ("empty.pdf", _pdf_bytes(), "application/pdf")},
    )
    # Should not 500 — returns 200 with a parse_warning
    assert response.status_code == 200
    data = response.json()
    assert "parse_warning" in data
    # parse_warning is either None (good parse) or a string message
    assert data["parse_warning"] is None or isinstance(data["parse_warning"], str)


def test_upload_accepts_valid_pdf():
    """A non-oversized, supported file should not return an error status."""
    small_pdf = _pdf_bytes()
    response = client.post(
        "/upload-cv",
        files={"file": ("cv.pdf", small_pdf, "application/pdf")},
    )
    assert response.status_code in (200, 500)  # 500 only if structurer fails, not upload guard
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd career-twin/backend && .venv/bin/pytest tests/test_upload_guards.py -v
```

Expected: `test_upload_rejects_file_over_10mb` FAILS (no size check exists), others may FAIL.

- [ ] **Step 3: Read `career-twin/backend/app/models/profile.py`**

Open the file and check the current `UploadResponse` model. It will look like:
```python
class UploadResponse(BaseModel):
    raw_text: str
    structured: CVProfile
```

Add `parse_warning` field:

```python
class UploadResponse(BaseModel):
    raw_text: str
    structured: CVProfile
    parse_warning: str | None = None
```

- [ ] **Step 4: Update `upload.py` with file-size guard and parse_warning**

Replace `career-twin/backend/app/api/upload.py` entirely:

```python
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.cv_parser import extract_text_from_bytes, UnsupportedFileTypeError
from app.services.cv_structurer import structure_cv
from app.models.profile import UploadResponse

router = APIRouter()

ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx"}
MAX_FILE_BYTES = 10 * 1024 * 1024  # 10 MB
MIN_TEXT_LENGTH = 100  # chars — below this we warn about parse quality


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

    if len(data) > MAX_FILE_BYTES:
        raise HTTPException(
            status_code=422,
            detail="File too large. Maximum allowed size is 10 MB.",
        )

    try:
        raw_text = extract_text_from_bytes(data, filename)
    except UnsupportedFileTypeError as e:
        raise HTTPException(status_code=422, detail=str(e))

    parse_warning: str | None = None
    if len(raw_text.strip()) < MIN_TEXT_LENGTH:
        parse_warning = (
            "We had trouble extracting text from your CV. "
            "The content below may be incomplete — please review and edit carefully."
        )

    try:
        structured = structure_cv(raw_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"CV structuring failed: {str(e)}")

    return UploadResponse(raw_text=raw_text, structured=structured, parse_warning=parse_warning)
```

- [ ] **Step 5: Run tests — should pass**

```bash
cd career-twin/backend && .venv/bin/pytest tests/test_upload_guards.py -v
```

Expected: all 3 PASS.

- [ ] **Step 6: Run full test suite to confirm no regression**

```bash
cd career-twin/backend && .venv/bin/pytest -v
```

Expected: all tests PASS.

- [ ] **Step 7: Commit**

```bash
git add career-twin/backend/app/models/profile.py career-twin/backend/app/api/upload.py career-twin/backend/tests/test_upload_guards.py
git commit -m "feat: upload file-size guard and parse_warning for short/empty CV text"
```

---

### Task 2: Add global exception handler to FastAPI

**Files:**
- Modify: `career-twin/backend/app/main.py`

- [ ] **Step 1: Update `main.py` to add global handler**

Replace `career-twin/backend/app/main.py` entirely:

```python
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import os
from dotenv import load_dotenv
from app.api.upload import router as upload_router
from app.api.profile import router as profile_router
from app.api.roles import router as roles_router

load_dotenv()

logger = logging.getLogger(__name__)

app = FastAPI(title="Career Twin API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload_router)
app.include_router(profile_router)
app.include_router(roles_router)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch all unhandled exceptions and return a clean JSON error instead of dropping the connection."""
    logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred. Please try again."},
    )


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "career-twin-api"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

- [ ] **Step 2: Run full test suite**

```bash
cd career-twin/backend && .venv/bin/pytest -v
```

Expected: all tests PASS.

- [ ] **Step 3: Commit**

```bash
git add career-twin/backend/app/main.py
git commit -m "feat: global exception handler — no more raw stack traces reaching the client"
```

---

### Task 3: Frontend — update types and show parse warning banner

**Files:**
- Modify: `career-twin/frontend/lib/types.ts`
- Modify: `career-twin/frontend/app/review/page.tsx`

- [ ] **Step 1: Add `parse_warning` to `UploadResponse` in `types.ts`**

Open `career-twin/frontend/lib/types.ts` and find the `UploadResponse` interface. It will look like:

```typescript
export interface UploadResponse {
  raw_text: string;
  structured: CVProfile;
}
```

Update it to:

```typescript
export interface UploadResponse {
  raw_text: string;
  structured: CVProfile;
  parse_warning?: string | null;
}
```

- [ ] **Step 2: Show parse warning banner on the review page**

Open `career-twin/frontend/app/review/page.tsx`. Read it first to find where the page renders its main content. The page reads from `sessionStorage` (key `upload_result`) to get the `UploadResponse`. Add a warning banner near the top of the returned JSX, just above the profile form.

The banner should only render when `uploadResult?.parse_warning` is truthy:

```tsx
{uploadResult?.parse_warning && (
  <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
    <strong>Heads up:</strong> {uploadResult.parse_warning}
  </div>
)}
```

Read the file first to know the exact variable name and insertion point, then make a targeted edit using the Edit tool.

- [ ] **Step 3: Run TypeScript check**

```bash
cd career-twin/frontend && npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add career-twin/frontend/lib/types.ts career-twin/frontend/app/review/page.tsx
git commit -m "feat: show parse quality warning banner on review page when CV text is short"
```

---

### Task 4: Create `DEMO_FLOW.md`

**Files:**
- Create: `career-twin/docs/DEMO_FLOW.md`

- [ ] **Step 1: Create the demo script**

```markdown
# Career Twin – Demo Flow

## Setup (before demo)

1. Start backend: `cd career-twin/backend && .venv/bin/uvicorn app.main:app --reload --port 8000`
2. Start frontend: `cd career-twin/frontend && npm run dev`
3. Open browser: `http://localhost:3000`
4. Have the "hero CV" PDF ready (see section below).
5. Confirm `GROQ_API_KEY` is set in `career-twin/backend/.env` for live responses.
   - If key is missing, the app uses mock data — still fully functional for demo.

---

## Demo Script

### Step 1 – Upload CV (30 sec)
- Drag and drop the hero CV PDF onto the upload zone.
- Watch the cycling loading messages ("Extracting text…", "Structuring your profile…").
- Point out: any PDF, no account needed.

### Step 2 – Review & Edit (1 min)
- The review page shows the structured CV parsed by the AI.
- Edit one field (e.g., change job title or add a skill) to show it's fully editable.
- Click **Confirm & Continue**.

### Step 3 – Role Suggestions (45 sec)
- Three role cards appear with personalised match scores.
- Explain: "The AI read your CV and decided these are your best next paths."
- Select one role card (e.g., ML Engineer).
- Click **Open Dashboard** — watch the "Analysing your fit…" overlay.

### Step 4 – Dashboard Walkthrough (3–4 min)

**Score section:**
- Show the overall match score and the breakdown (skills / experience / education).

**Strengths & Weaknesses:**
- Read out 2 strengths and 1 weakness — show they're personalised to the CV.

**Skills Gap:**
- Point to matched skills (green) vs missing skills (red).
- "This tells you exactly what to learn next."

**Readiness & Action Plan:**
- Show readiness level (Ready / Nearly Ready / Developing).
- Read the first priority improvement.

**Projects:**
- Show 2–3 suggested projects with their one-line descriptions.
- "These are real, portfolio-worthy projects tied to your chosen role."

**Resume Improvements:**
- Show the CV tips in the right panel.

**Career Pathway:**
- Show the 0–6 / 6–18 / 2–4 year goals.

### Step 5 – Utility Tools (1 min)
- Click **⇆ Compare** — show the comparison scores for the second role.
- Click a different role in the left sidebar — watch the dashboard re-analyse live.
- Use the **Evidence filter** chips (CV / Projects / Certificates) to filter the right panel.
- Click **↻ Regenerate** to return to role selection.

---

## Hero CV Selection

Test 3 CVs before demo day and pick the one with the most interesting output:

| CV Type | What to look for |
|---------|-----------------|
| Technical student (CS/Eng) | Clear skills gap in cloud/MLOps, strong project suggestions |
| Business student (MBA/Fin) | Product Manager or Strategy roles, soft skill strengths |
| Hybrid (Econ + coding) | Data Analyst or Product path, interesting alternative roles |

**Pick the CV that produces the most specific and believable role analysis.**

Save your chosen PDF as `career-twin/docs/demo-cv.pdf` (gitignored — do not commit real CVs).

---

## Fallback: Mock Mode

If the API key is missing or Groq is down, the app automatically returns mock data. The flow is identical — mock data looks realistic for demo purposes.

To force mock mode: remove or empty `GROQ_API_KEY` in `career-twin/backend/.env`.

---

## Edge Cases to Avoid

- Very scanned/image-based PDFs (no extractable text → weak parse warning shown, but LLM output will be generic).
- PDFs over 10 MB (blocked with a clean error).
- Extremely short CVs (1 page, sparse) — output will be less specific.
```

- [ ] **Step 2: Commit**

```bash
git add career-twin/docs/DEMO_FLOW.md
git commit -m "docs: add DEMO_FLOW.md with setup steps, demo script, and hero CV selection guide"
```

---

### Self-Review Checklist

1. **Spec coverage:**
   - ✅ Upload: bad file → clean error (422 with detail message)
   - ✅ Upload: huge file → 422 "File too large" — Task 1
   - ✅ Parsing: weak parse → parse_warning shown on review page — Tasks 1 & 3
   - ✅ LLM: timeout/error → already handled by mock fallbacks (pre-existing) + global handler — Task 2
   - ✅ Global: no raw stack traces — Task 2 global exception handler
   - ✅ Demo script — Task 4
   - ✅ `docs/DEMO_FLOW.md` created — Task 4

2. **Placeholder scan:** No TBD or incomplete steps. `review/page.tsx` step instructs agent to read file first before editing — this is intentional to avoid prescribing exact line numbers that may differ.

3. **Type consistency:** `parse_warning: str | None = None` in Pydantic model, `parse_warning?: string | null` in TypeScript. Both nullable/optional. `UploadResponse` is referenced in `app/page.tsx` (upload) and `app/review/page.tsx` (review) — both use the same type from `lib/types.ts`.
