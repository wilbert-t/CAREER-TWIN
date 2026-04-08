# Project Detail Popup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a user clicks a project card in the Possible Projects section, a modal fires a new LLM call and shows a rich breakdown (difficulty, uniqueness, duration, description, objectives, tools required).

**Architecture:** New `POST /expand-project` backend endpoint calls Groq with CV text (truncated to 2000 chars) + role + project name. Frontend `ProjectDetailModal` component opens on click, shows a loading skeleton while the call is in flight, and fills in detail when it resolves. Modal state lives in `MainContent`.

**Tech Stack:** FastAPI, Pydantic, httpx, Groq llama-3.3-70b-versatile, Next.js App Router, TypeScript, Tailwind CSS

---

## File Map

| Action | Path | Responsibility |
|--------|------|---------------|
| Modify | `backend/app/models/analysis.py` | Add `ExpandProjectRequest`, `ExpandProjectResponse` models |
| Create | `backend/app/prompts/expand_project.py` | LLM prompt template for project expansion |
| Create | `backend/app/services/project_expander.py` | Service: calls Groq, mock fallback |
| Modify | `backend/app/api/roles.py` | Register `POST /expand-project` route |
| Modify | `backend/tests/test_roles.py` | Tests for new endpoint |
| Modify | `frontend/lib/types.ts` | Add `ProjectDetail` interface |
| Modify | `frontend/lib/api.ts` | Add `expandProject` function |
| Create | `frontend/components/dashboard/ProjectDetailModal.tsx` | Modal component |
| Modify | `frontend/components/dashboard/MainContent.tsx` | Clickable cards, modal state, new props |
| Modify | `frontend/app/dashboard/page.tsx` | Pass `profileId` and `selectedRole` to `MainContent` |

---

## Task 1: Add Pydantic models for expand-project

**Files:**
- Modify: `career-twin/backend/app/models/analysis.py`

- [ ] **Step 1: Add models to analysis.py**

Open `career-twin/backend/app/models/analysis.py` and append after the `AnalyzeRoleFitResponse` class:

```python
class ExpandProjectRequest(BaseModel):
    profile_id: str
    role: str
    project_name: str
    short_description: str


class ExpandProjectResponse(BaseModel):
    name: str
    short_description: str
    difficulty: int = Field(..., ge=1, le=5)
    uniqueness: int = Field(..., ge=1, le=5)
    duration: str
    description: str
    objectives: str
    tools_required: list[str] = Field(default_factory=list)
```

- [ ] **Step 2: Verify models import cleanly**

```bash
cd career-twin/backend && source .venv/bin/activate && python -c "from app.models.analysis import ExpandProjectRequest, ExpandProjectResponse; print('OK')"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add career-twin/backend/app/models/analysis.py
git commit -m "feat: add ExpandProjectRequest and ExpandProjectResponse models"
```

---

## Task 2: Write the LLM prompt

**Files:**
- Create: `career-twin/backend/app/prompts/expand_project.py`

- [ ] **Step 1: Create the prompt file**

```python
EXPAND_PROJECT_PROMPT = """\
You are a senior software engineer and career mentor. Given a candidate's CV and a project idea \
for a specific role, produce a detailed project breakdown that will help the candidate build it.

TARGET ROLE: {role}

PROJECT: {project_name}
SHORT DESCRIPTION: {short_description}

CANDIDATE CV (excerpt):
{raw_text}

Return a single JSON object with EXACTLY these fields:

{{
  "name": "{project_name}",
  "short_description": "{short_description}",
  "difficulty": <int 1-5>,
  "uniqueness": <int 1-5>,
  "duration": "<realistic string e.g. '1-2 weeks' or '3-4 weeks'>",
  "description": "<3-5 sentences: what the project builds, what problem it solves, what the end result looks like>",
  "objectives": "<2-3 sentences: why this project specifically strengthens the candidate for the target role, what skills they will demonstrate and learn>",
  "tools_required": ["tool1", "tool2", "tool3"]
}}

SCORING RULES:
difficulty (how hard is this project for a university student):
  1: Simple weekend project — one technology, no integrations
  2: Beginner-friendly — 1-2 technologies, clear tutorials exist
  3: Intermediate — requires combining 2-3 tools, some debugging expected
  4: Challenging — multiple systems, deployment, or research required
  5: Advanced — production-grade complexity, novel problem-solving required

uniqueness (how distinctive is this for a portfolio):
  1: Very common — thousands of identical projects exist on GitHub
  2: Common — easy to find similar examples
  3: Moderately distinctive — needs a specific angle to stand out
  4: Distinctive — relatively rare combination of problem + stack
  5: Very distinctive — rare problem domain or novel approach

duration: Use realistic ranges like "1-2 weeks", "2-3 weeks", "3-5 weeks", "4-6 weeks".
  Base this on the difficulty and the scope described.

tools_required: List every language, framework, library, API, and service the candidate
  would realistically use to build this project. Be specific and exhaustive.

RULES:
- Return ONLY valid JSON. No markdown, no commentary.
- tools_required must have at least 3 items.
- description must be specific to this project — no generic filler.
- objectives must reference the target role explicitly.
"""
```

- [ ] **Step 2: Verify import**

```bash
cd career-twin/backend && python -c "from app.prompts.expand_project import EXPAND_PROJECT_PROMPT; print('OK')"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add career-twin/backend/app/prompts/expand_project.py
git commit -m "feat: add expand_project LLM prompt"
```

---

## Task 3: Write the project expander service

**Files:**
- Create: `career-twin/backend/app/services/project_expander.py`

- [ ] **Step 1: Create the service file**

```python
import os
import json
import httpx
from app.models.profile import CVProfile
from app.models.analysis import ExpandProjectResponse
from app.prompts.expand_project import EXPAND_PROJECT_PROMPT

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.3-70b-versatile"


def expand_project(
    profile: CVProfile,
    role: str,
    project_name: str,
    short_description: str,
) -> ExpandProjectResponse:
    """Expand a project idea into a detailed breakdown. Uses mock if no API key."""
    api_key = os.getenv("GROQ_API_KEY", "")
    if not api_key:
        return _mock_expansion(project_name, short_description)

    prompt = EXPAND_PROJECT_PROMPT.format(
        role=role,
        project_name=project_name,
        short_description=short_description,
        raw_text=profile.raw_text[:2000],
    )

    with httpx.Client(timeout=60) as client:
        resp = client.post(
            GROQ_API_URL,
            headers={"Authorization": f"Bearer {api_key}"},
            json={
                "model": GROQ_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.4,
            },
        )
        resp.raise_for_status()

    content = resp.json()["choices"][0]["message"]["content"].strip()
    if content.startswith("```"):
        content = content.split("\n", 1)[-1]
        content = content.rsplit("```", 1)[0].strip()

    data = json.loads(content)
    return ExpandProjectResponse(**data)


def _mock_expansion(project_name: str, short_description: str) -> ExpandProjectResponse:
    return ExpandProjectResponse(
        name=project_name,
        short_description=short_description,
        difficulty=3,
        uniqueness=3,
        duration="2-3 weeks",
        description=(
            f"{project_name} involves building a full-stack application that {short_description.lower()}. "
            "The project starts with data modelling and a backend API, then adds a clean frontend interface. "
            "By the end you will have a deployable application with real-world structure and documented code."
        ),
        objectives=(
            "This project directly demonstrates skills that hiring managers look for in entry-level candidates. "
            "You will practise the full development lifecycle — from design to deployment — and produce a "
            "portfolio piece you can walk through in interviews."
        ),
        tools_required=["Python", "FastAPI", "React", "PostgreSQL", "Docker", "Git"],
    )
```

- [ ] **Step 2: Verify import**

```bash
cd career-twin/backend && python -c "from app.services.project_expander import expand_project; print('OK')"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add career-twin/backend/app/services/project_expander.py
git commit -m "feat: project_expander service with Groq call and mock fallback"
```

---

## Task 4: Register the route and write tests

**Files:**
- Modify: `career-twin/backend/app/api/roles.py`
- Modify: `career-twin/backend/tests/test_roles.py`

- [ ] **Step 1: Write the failing tests first**

Add to the bottom of `career-twin/backend/tests/test_roles.py`:

```python
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
```

- [ ] **Step 2: Run tests to confirm they fail (route doesn't exist yet)**

```bash
cd career-twin/backend && pytest tests/test_roles.py::test_expand_project_returns_all_fields tests/test_roles.py::test_expand_project_404_on_unknown_profile -v
```

Expected: both FAIL with 404 or connection error (route not yet registered)

- [ ] **Step 3: Add the route to roles.py**

Add these imports at the top of `career-twin/backend/app/api/roles.py`:

```python
from app.models.analysis import (
    SuggestRolesRequest,
    SuggestRolesResponse,
    AnalyzeRoleFitRequest,
    AnalyzeRoleFitResponse,
    ExpandProjectRequest,
    ExpandProjectResponse,
)
from app.services.role_suggester import suggest_roles
from app.services.role_analyzer import analyze_role_fit
from app.services.project_expander import expand_project
from app.utils.store import get_profile
```

Then append the new route at the bottom of `roles.py`:

```python
@router.post("/expand-project", response_model=ExpandProjectResponse)
def expand_project_endpoint(body: ExpandProjectRequest):
    profile = get_profile(body.profile_id)
    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Profile not found. Please upload your CV again.",
        )
    try:
        result = expand_project(profile, body.role, body.project_name, body.short_description)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Project expansion failed: {str(e)}")
    return result
```

- [ ] **Step 4: Run tests — both must pass**

```bash
cd career-twin/backend && pytest tests/test_roles.py -v
```

Expected: all tests PASS including the two new ones

- [ ] **Step 5: Commit**

```bash
git add career-twin/backend/app/api/roles.py career-twin/backend/tests/test_roles.py
git commit -m "feat: POST /expand-project endpoint with TDD tests"
```

---

## Task 5: Frontend types and API function

**Files:**
- Modify: `career-twin/frontend/lib/types.ts`
- Modify: `career-twin/frontend/lib/api.ts`

- [ ] **Step 1: Add ProjectDetail type to types.ts**

Append to `career-twin/frontend/lib/types.ts`:

```ts
export interface ProjectDetail {
  name: string;
  short_description: string;
  difficulty: number;   // 1-5
  uniqueness: number;   // 1-5
  duration: string;
  description: string;
  objectives: string;
  tools_required: string[];
}
```

- [ ] **Step 2: Add expandProject to api.ts**

Append to `career-twin/frontend/lib/api.ts`:

```ts
export async function expandProject(
  profileId: string,
  role: string,
  projectName: string,
  shortDescription: string
): Promise<import("./types").ProjectDetail> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/expand-project`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profile_id: profileId,
        role,
        project_name: projectName,
        short_description: shortDescription,
      }),
    });
  } catch {
    throw new Error("Cannot connect to server. Make sure the backend is running on port 8000.");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? `Request failed: ${res.status}`);
  }
  return res.json();
}
```

- [ ] **Step 3: Fix the import in api.ts — update the import line at the top**

The `import("./types")` inline import works, but for consistency with the file's style, update the top import to include `ProjectDetail`:

```ts
import type { CVProfile, UploadResponse, ConfirmResponse, SuggestRolesResponse, AnalyzeRoleFitResponse, ProjectDetail } from "./types";
```

Then change the `expandProject` return type to just `Promise<ProjectDetail>` (remove the inline import).

- [ ] **Step 4: Commit**

```bash
git add career-twin/frontend/lib/types.ts career-twin/frontend/lib/api.ts
git commit -m "feat: ProjectDetail type and expandProject API function"
```

---

## Task 6: Build ProjectDetailModal component

**Files:**
- Create: `career-twin/frontend/components/dashboard/ProjectDetailModal.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { useEffect } from "react";
import type { ProjectDetail } from "@/lib/types";

interface ProjectDetailModalProps {
  projectName: string;
  detail: ProjectDetail | null;
  error: string | null;
  onClose: () => void;
  onRetry: () => void;
}

function StarRating({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-lg border border-slate-200 bg-white px-4 py-2">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className={i < value ? "text-amber-400" : "text-slate-200"}>
            ★
          </span>
        ))}
      </div>
    </div>
  );
}

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded bg-slate-100 ${className ?? ""}`} />
  );
}

export function ProjectDetailModal({
  projectName,
  detail,
  error,
  onClose,
  onRetry,
}: ProjectDetailModalProps) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 leading-tight">{projectName}</h2>
            {detail && (
              <p className="mt-0.5 text-sm text-slate-500">{detail.short_description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {error ? (
            <div className="rounded-xl bg-red-50 px-4 py-4 text-center">
              <p className="text-sm text-red-700 mb-3">{error}</p>
              <button
                onClick={onRetry}
                className="rounded-lg border border-red-200 bg-white px-4 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : detail ? (
            <>
              {/* Badges */}
              <div className="flex gap-3">
                <StarRating value={detail.difficulty} label="Difficulty" />
                <StarRating value={detail.uniqueness} label="Uniqueness" />
                <div className="flex flex-col items-center gap-1 rounded-lg border border-slate-200 bg-white px-4 py-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Duration</span>
                  <span className="text-sm font-semibold text-slate-700">{detail.duration}</span>
                </div>
              </div>

              {/* Description */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Description</p>
                <p className="text-sm text-slate-700 leading-relaxed">{detail.description}</p>
              </div>

              {/* Objectives */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Objectives</p>
                <p className="text-sm text-slate-700 leading-relaxed">{detail.objectives}</p>
              </div>

              {/* Tools Required */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Tools Required</p>
                <div className="flex flex-wrap gap-2">
                  {detail.tools_required.map((tool, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* Loading skeleton */
            <>
              <div className="flex gap-3">
                <Skeleton className="h-16 w-24" />
                <Skeleton className="h-16 w-24" />
                <Skeleton className="h-16 w-24" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-28" />
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-7 w-16 rounded-full" />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add career-twin/frontend/components/dashboard/ProjectDetailModal.tsx
git commit -m "feat: ProjectDetailModal component with star ratings, skeleton loading, error state"
```

---

## Task 7: Wire modal into MainContent

**Files:**
- Modify: `career-twin/frontend/components/dashboard/MainContent.tsx`

- [ ] **Step 1: Update MainContent props interface and add imports**

Replace the top of `MainContent.tsx` (the imports and interface section) with:

```tsx
import { useState } from "react";
import type { AnalyzeRoleFitResponse, PriorityImprovement, ProjectDetail } from "@/lib/types";
import { expandProject } from "@/lib/api";
import { SpeedometerArc, scoreToArcColor } from "./SpeedometerArc";
import { ProjectDetailModal } from "./ProjectDetailModal";

interface MainContentProps {
  data: AnalyzeRoleFitResponse;
  profileId: string;
  selectedRole: string;
}
```

- [ ] **Step 2: Update the MainContent function signature and add modal state**

Replace the `export function MainContent({ data }: MainContentProps)` line and add state:

```tsx
export function MainContent({ data, profileId, selectedRole }: MainContentProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalProjectName, setModalProjectName] = useState("");
  const [modalDetail, setModalDetail] = useState<ProjectDetail | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  function handleProjectClick(name: string, shortDesc: string) {
    setModalProjectName(name);
    setModalDetail(null);
    setModalError(null);
    setModalOpen(true);
    loadProjectDetail(name, shortDesc);
  }

  function loadProjectDetail(name: string, shortDesc: string) {
    expandProject(profileId, selectedRole, name, shortDesc)
      .then((result) => setModalDetail(result))
      .catch((err) => setModalError(err.message ?? "Failed to load project details."));
  }
```

- [ ] **Step 3: Update the Possible Projects section in the JSX**

Replace the existing Possible Projects `<Section>` block:

```tsx
      {/* Possible Projects */}
      <Section id="possible-projects" title="Possible Projects">
        <div className="space-y-2">
          {data.possible_projects.map((project, i) => {
            const [name, ...rest] = project.split(":");
            const shortDesc = rest.join(":").trim();
            return (
              <button
                key={i}
                onClick={() => handleProjectClick(name.trim(), shortDesc)}
                className="w-full rounded-xl border border-slate-100 bg-white p-4 text-left hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-800 text-sm">{name.trim()}</p>
                  <span className="text-xs text-slate-400 group-hover:text-slate-600 transition-colors">View details →</span>
                </div>
                {shortDesc && (
                  <p className="text-sm text-slate-500 mt-1">{shortDesc}</p>
                )}
              </button>
            );
          })}
        </div>
      </Section>
```

- [ ] **Step 4: Add the modal to the JSX return, just before the closing `</div>`**

Add before the final `</div>` at the end of `MainContent`'s return:

```tsx
      {/* Project Detail Modal */}
      {modalOpen && (
        <ProjectDetailModal
          projectName={modalProjectName}
          detail={modalDetail}
          error={modalError}
          onClose={() => { setModalOpen(false); setModalDetail(null); setModalError(null); }}
          onRetry={() => {
            setModalDetail(null);
            setModalError(null);
            const proj = data.possible_projects.find((p) => p.startsWith(modalProjectName));
            const shortDesc = proj ? proj.split(":").slice(1).join(":").trim() : "";
            loadProjectDetail(modalProjectName, shortDesc);
          }}
        />
      )}
```

- [ ] **Step 5: Commit**

```bash
git add career-twin/frontend/components/dashboard/MainContent.tsx
git commit -m "feat: clickable project cards open ProjectDetailModal with on-demand LLM expansion"
```

---

## Task 8: Update dashboard page to pass new props

**Files:**
- Modify: `career-twin/frontend/app/dashboard/page.tsx`

- [ ] **Step 1: Pass profileId and selectedRole to both MainContent instances**

In `dashboard/page.tsx`, find the two `<MainContent data={analysis} />` usages and update them:

```tsx
{/* In the compare view — current role column */}
<MainContent data={analysis} profileId={profileId} selectedRole={selectedRole} />

{/* In the compare view — compared role column */}
<MainContent data={compareAnalysis} profileId={profileId} selectedRole={compareRole} />

{/* In the single view */}
<MainContent data={analysis} profileId={profileId} selectedRole={selectedRole} />
```

- [ ] **Step 2: Verify TypeScript compiles without errors**

```bash
cd career-twin/frontend && npx tsc --noEmit 2>&1 | head -30
```

Expected: no output (no errors). If errors appear, fix the prop types before proceeding.

- [ ] **Step 3: Commit**

```bash
git add career-twin/frontend/app/dashboard/page.tsx
git commit -m "feat: pass profileId and selectedRole to MainContent for project expansion"
```

---

## Task 9: End-to-end verification

- [ ] **Step 1: Run backend tests**

```bash
cd career-twin/backend && pytest tests/test_roles.py -v
```

Expected: all tests PASS

- [ ] **Step 2: Start backend**

```bash
cd career-twin/backend && uvicorn app.main:app --reload
```

Expected: server starts on port 8000, no import errors in output

- [ ] **Step 3: Smoke test the endpoint with curl**

```bash
curl -s -X POST http://localhost:8000/expand-project \
  -H "Content-Type: application/json" \
  -d '{"profile_id":"fake","role":"ML Engineer","project_name":"Sentiment API","short_description":"Classify text"}' \
  | python3 -m json.tool | head -5
```

Expected: `{"detail": "Profile not found..."}` with 404 — confirms the route is live

- [ ] **Step 4: Start frontend**

```bash
cd career-twin/frontend && npm run dev
```

- [ ] **Step 5: Happy path test**

1. Upload a CV PDF
2. Proceed through review → roles → dashboard
3. Scroll to "Possible Projects" section
4. Click any project card
5. Confirm: modal opens immediately with skeleton loading
6. Confirm: after ~3-5 seconds, real content populates (or mock content if no API key)
7. Confirm: star ratings render for difficulty and uniqueness
8. Confirm: Escape key closes the modal
9. Confirm: clicking outside the modal closes it

- [ ] **Step 6: Edge case — modal retry**

1. Temporarily set `GROQ_API_KEY=badkey` in `.env`
2. Click a project card
3. Confirm: error message appears with Retry button
4. Restore correct key

- [ ] **Step 7: Final commit if any cleanup was needed**

```bash
git add -p
git commit -m "chore: project detail popup cleanup after e2e verification"
```
