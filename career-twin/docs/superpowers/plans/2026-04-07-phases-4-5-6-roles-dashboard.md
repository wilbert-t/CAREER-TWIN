# Phases 4–6: Role Suggestion, Dashboard, Analysis Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full flow from role suggestion → role selection → fit analysis → dashboard display.

**Architecture:** User confirms CV profile → `/suggest-roles` returns 3 LLM-generated role cards → user picks one (or types custom) → `/analyze-role-fit` runs a single Groq LLM call returning a 15-field JSON object → result stored in `sessionStorage` → dashboard reads it and renders a fixed 3-column layout. Both backend services follow the existing `cv_structurer` pattern: one LLM call with a structured prompt, markdown-fence stripping before `json.loads`, and a full mock fallback when `GROQ_API_KEY` is absent.

**Tech Stack:** FastAPI, Pydantic v2, httpx, Groq (llama-3.3-70b-versatile), pytest, Next.js 16 App Router, TypeScript, Tailwind CSS v4, shadcn/ui

---

## File Map

**Create:**
- `career-twin/backend/app/models/analysis.py` — Pydantic models for roles and analysis
- `career-twin/backend/app/prompts/suggest_roles.py` — prompt template for role suggestion
- `career-twin/backend/app/prompts/analyze_role_fit.py` — prompt template for full analysis
- `career-twin/backend/app/services/role_suggester.py` — LLM call + mock for role suggestion
- `career-twin/backend/app/services/role_analyzer.py` — LLM call + mock for role analysis
- `career-twin/backend/app/api/roles.py` — POST /suggest-roles, POST /analyze-role-fit
- `career-twin/backend/tests/test_roles.py` — tests for both endpoints
- `career-twin/frontend/components/roles/RoleCard.tsx` — single role card (selectable)
- `career-twin/frontend/app/roles/page.tsx` — role selection page
- `career-twin/frontend/components/dashboard/LeftSidebar.tsx` — roles list sidebar
- `career-twin/frontend/components/dashboard/MainContent.tsx` — scrollable analysis sections
- `career-twin/frontend/components/dashboard/RightPanel.tsx` — evidence + actions panel
- `career-twin/frontend/app/dashboard/page.tsx` — 3-column dashboard layout

**Modify:**
- `career-twin/backend/app/main.py` — include roles router
- `career-twin/frontend/lib/types.ts` — add RoleSuggestion, SuggestRolesResponse, AnalyzeRoleFitResponse
- `career-twin/frontend/lib/api.ts` — add suggestRoles(), analyzeRoleFit()
- `.gitignore` — add .superpowers/

---

## Task 1: Backend models

**Files:**
- Create: `career-twin/backend/app/models/analysis.py`

- [ ] **Step 1: Create the models file**

```python
# career-twin/backend/app/models/analysis.py
from __future__ import annotations
from typing import Any
from pydantic import BaseModel, Field


class RoleSuggestion(BaseModel):
    id: str
    title: str
    short_description: str
    preview_match_score: int  # 0–100


class SuggestRolesRequest(BaseModel):
    profile_id: str


class SuggestRolesResponse(BaseModel):
    roles: list[RoleSuggestion]


class AnalyzeRoleFitRequest(BaseModel):
    profile_id: str
    selected_role: str  # role id or free-text string


class AnalyzeRoleFitResponse(BaseModel):
    selected_role: dict[str, Any] = Field(default_factory=dict)
    match_score: dict[str, Any] = Field(default_factory=dict)
    score_breakdown: dict[str, Any] = Field(default_factory=dict)
    strengths: list[str] = Field(default_factory=list)
    weaknesses: list[str] = Field(default_factory=list)
    matched_skills: list[str] = Field(default_factory=list)
    missing_skills: list[str] = Field(default_factory=list)
    readiness_summary: dict[str, Any] = Field(default_factory=dict)
    priority_improvements: list[str] = Field(default_factory=list)
    learning_steps: list[str] = Field(default_factory=list)
    possible_projects: list[str] = Field(default_factory=list)
    resume_improvements: list[str] = Field(default_factory=list)
    alternative_roles: list[str] = Field(default_factory=list)
    goal_pathway: dict[str, Any] = Field(default_factory=dict)
    evidence_items: list[str] = Field(default_factory=list)
```

- [ ] **Step 2: Verify import works**

```bash
cd career-twin/backend && .venv/bin/python -c "from app.models.analysis import RoleSuggestion, AnalyzeRoleFitResponse; print('OK')"
```
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add career-twin/backend/app/models/analysis.py
git commit -m "feat: add analysis Pydantic models"
```

---

## Task 2: Prompts

**Files:**
- Create: `career-twin/backend/app/prompts/suggest_roles.py`
- Create: `career-twin/backend/app/prompts/analyze_role_fit.py`

- [ ] **Step 1: Create suggest_roles prompt**

```python
# career-twin/backend/app/prompts/suggest_roles.py
SUGGEST_ROLES_PROMPT = """\
You are a career advisor. Given the candidate's CV below, suggest exactly 3 career roles \
that best match their background.

Return a JSON array with exactly 3 objects. Each object must have these fields:
- "id": a short snake_case identifier (e.g. "ml_engineer")
- "title": the role title
- "short_description": one sentence describing what this role does
- "preview_match_score": integer from 0 to 100 estimating how well the candidate matches

Rules:
- Return ONLY the JSON array. No markdown, no commentary.
- Scores must be realistic and differentiated (not all the same).
- Order by score descending.

CANDIDATE CV:
{raw_text}
"""
```

- [ ] **Step 2: Create analyze_role_fit prompt**

```python
# career-twin/backend/app/prompts/analyze_role_fit.py
ANALYZE_ROLE_FIT_PROMPT = """\
You are a career analyst. Given the candidate's CV and their target role, produce a \
comprehensive career fit analysis.

Return a single JSON object with EXACTLY these fields:

{{
  "selected_role": {{"title": "...", "id": "...", "description": "one sentence"}},
  "match_score": {{"overall": <int 0-100>, "label": "Good Match|Strong Match|Developing Match"}},
  "score_breakdown": {{"skills": <int 0-100>, "experience": <int 0-100>, "education": <int 0-100>}},
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "matched_skills": ["skill1", "skill2"],
  "missing_skills": ["skill1", "skill2"],
  "readiness_summary": {{"level": "Ready|Nearly Ready|Developing", "summary": "2 sentence summary"}},
  "priority_improvements": ["action 1", "action 2", "action 3"],
  "learning_steps": ["step 1", "step 2", "step 3", "step 4"],
  "possible_projects": ["Project name: one sentence description", "Project name: one sentence description", "Project name: one sentence description"],
  "resume_improvements": ["improvement 1", "improvement 2"],
  "alternative_roles": ["Role A", "Role B"],
  "goal_pathway": {{"short_term": "0-6 months goal", "mid_term": "6-18 months goal", "long_term": "2-4 years goal"}},
  "evidence_items": ["CV line that demonstrates fit 1", "CV line that demonstrates fit 2"]
}}

Rules:
- Return ONLY valid JSON. No markdown, no commentary.
- Be specific and personalised to this candidate's actual CV content.
- All list fields must have at least 2 items.

TARGET ROLE: {role}

CANDIDATE CV:
{raw_text}
"""
```

- [ ] **Step 3: Verify imports**

```bash
cd career-twin/backend && .venv/bin/python -c "
from app.prompts.suggest_roles import SUGGEST_ROLES_PROMPT
from app.prompts.analyze_role_fit import ANALYZE_ROLE_FIT_PROMPT
print(SUGGEST_ROLES_PROMPT[:40])
print(ANALYZE_ROLE_FIT_PROMPT[:40])
"
```
Expected: first 40 chars of each prompt printed, no errors.

- [ ] **Step 4: Commit**

```bash
git add career-twin/backend/app/prompts/suggest_roles.py career-twin/backend/app/prompts/analyze_role_fit.py
git commit -m "feat: add role suggestion and analysis prompt templates"
```

---

## Task 3: Role suggester service

**Files:**
- Create: `career-twin/backend/app/services/role_suggester.py`

- [ ] **Step 1: Create the service**

```python
# career-twin/backend/app/services/role_suggester.py
import os
import json
import httpx
from app.models.profile import CVProfile
from app.models.analysis import RoleSuggestion
from app.prompts.suggest_roles import SUGGEST_ROLES_PROMPT

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.3-70b-versatile"


def suggest_roles(profile: CVProfile) -> list[RoleSuggestion]:
    """Return 3 suggested roles for the given profile. Uses mock if no API key."""
    api_key = os.getenv("GROQ_API_KEY", "")
    if not api_key:
        return _mock_roles()

    prompt = SUGGEST_ROLES_PROMPT.format(raw_text=profile.raw_text[:4000])

    with httpx.Client(timeout=30) as client:
        resp = client.post(
            GROQ_API_URL,
            headers={"Authorization": f"Bearer {api_key}"},
            json={
                "model": GROQ_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.3,
            },
        )
        resp.raise_for_status()

    content = resp.json()["choices"][0]["message"]["content"].strip()
    if content.startswith("```"):
        content = content.split("\n", 1)[-1]
        content = content.rsplit("```", 1)[0].strip()

    data = json.loads(content)
    return [RoleSuggestion(**r) for r in data]


def _mock_roles() -> list[RoleSuggestion]:
    return [
        RoleSuggestion(
            id="ml_engineer",
            title="ML Engineer",
            short_description="Build and deploy machine learning models at scale.",
            preview_match_score=78,
        ),
        RoleSuggestion(
            id="data_scientist",
            title="Data Scientist",
            short_description="Extract insights from data using statistics and ML.",
            preview_match_score=71,
        ),
        RoleSuggestion(
            id="backend_developer",
            title="Backend Developer",
            short_description="Design APIs and scalable server infrastructure.",
            preview_match_score=65,
        ),
    ]
```

- [ ] **Step 2: Verify mock works (no API key needed)**

```bash
cd career-twin/backend && .venv/bin/python -c "
import os; os.environ['GROQ_API_KEY'] = ''
from app.models.profile import CVProfile
from app.services.role_suggester import suggest_roles
profile = CVProfile(name='Test', raw_text='Python developer')
roles = suggest_roles(profile)
print(len(roles), roles[0].title)
"
```
Expected: `3 ML Engineer`

- [ ] **Step 3: Commit**

```bash
git add career-twin/backend/app/services/role_suggester.py
git commit -m "feat: add role suggester service with mock fallback"
```

---

## Task 4: Role analyzer service

**Files:**
- Create: `career-twin/backend/app/services/role_analyzer.py`

- [ ] **Step 1: Create the service**

```python
# career-twin/backend/app/services/role_analyzer.py
import os
import json
import httpx
from app.models.profile import CVProfile
from app.models.analysis import AnalyzeRoleFitResponse
from app.prompts.analyze_role_fit import ANALYZE_ROLE_FIT_PROMPT

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.3-70b-versatile"


def analyze_role_fit(profile: CVProfile, role: str) -> AnalyzeRoleFitResponse:
    """Run full role fit analysis. Uses mock if no API key."""
    api_key = os.getenv("GROQ_API_KEY", "")
    if not api_key:
        return _mock_analysis(role)

    prompt = ANALYZE_ROLE_FIT_PROMPT.format(role=role, raw_text=profile.raw_text[:4000])

    with httpx.Client(timeout=60) as client:
        resp = client.post(
            GROQ_API_URL,
            headers={"Authorization": f"Bearer {api_key}"},
            json={
                "model": GROQ_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.3,
            },
        )
        resp.raise_for_status()

    content = resp.json()["choices"][0]["message"]["content"].strip()
    if content.startswith("```"):
        content = content.split("\n", 1)[-1]
        content = content.rsplit("```", 1)[0].strip()

    data = json.loads(content)
    return AnalyzeRoleFitResponse(**data)


def _mock_analysis(role: str) -> AnalyzeRoleFitResponse:
    return AnalyzeRoleFitResponse(
        selected_role={"title": role, "id": "custom", "description": f"A career as {role}"},
        match_score={"overall": 74, "label": "Good Match"},
        score_breakdown={"skills": 80, "experience": 65, "education": 78},
        strengths=[
            "Strong programming fundamentals",
            "Research and analytical experience",
            "Fast learner with academic track record",
        ],
        weaknesses=[
            "Limited industry / production experience",
            "No cloud platform certifications",
        ],
        matched_skills=["Python", "Statistics", "Git", "Data Analysis"],
        missing_skills=["PyTorch", "MLOps", "Docker", "Cloud platforms"],
        readiness_summary={
            "level": "Nearly Ready",
            "summary": (
                "Strong academic foundation with directly relevant technical skills. "
                "Needs hands-on project experience to bridge the gap to industry roles."
            ),
        },
        priority_improvements=[
            "Build a portfolio project using PyTorch end-to-end",
            "Get certified in AWS or GCP (Cloud Practitioner level)",
            "Contribute to an open-source ML project on GitHub",
        ],
        learning_steps=[
            "Complete fast.ai Practical Deep Learning course (free, 7 lessons)",
            "Build and deploy one end-to-end ML project with a public API",
            "Learn Docker basics and containerise your project",
            "Practice on 2 Kaggle competitions to build public proof of work",
        ],
        possible_projects=[
            "Sentiment analysis API: Build a REST API that classifies text sentiment using a fine-tuned transformer",
            "Image classifier: Train a CNN on a public dataset and serve predictions via FastAPI",
            "Recommendation system: Build a collaborative filtering engine using MovieLens data",
        ],
        resume_improvements=[
            "Quantify the impact of internship work (e.g. 'reduced processing time by 30%')",
            "Add a Projects section showcasing 2-3 ML projects with GitHub links",
        ],
        alternative_roles=["Data Analyst", "ML Research Assistant", "Data Engineer"],
        goal_pathway={
            "short_term": "Build 2 portfolio projects and complete fast.ai course (0–6 months)",
            "mid_term": "Land a junior ML engineer or data scientist role (6–18 months)",
            "long_term": "Lead ML initiatives and mentor junior engineers (2–4 years)",
        },
        evidence_items=[
            "Python listed as primary skill — directly transferable to ML engineering",
            "Research Assistant role shows analytical thinking and experiment design",
        ],
    )
```

- [ ] **Step 2: Verify mock works**

```bash
cd career-twin/backend && .venv/bin/python -c "
import os; os.environ['GROQ_API_KEY'] = ''
from app.models.profile import CVProfile
from app.services.role_analyzer import analyze_role_fit
profile = CVProfile(name='Test', raw_text='Python developer')
result = analyze_role_fit(profile, 'ML Engineer')
print(result.match_score, len(result.learning_steps))
"
```
Expected: `{'overall': 74, 'label': 'Good Match'} 4`

- [ ] **Step 3: Commit**

```bash
git add career-twin/backend/app/services/role_analyzer.py
git commit -m "feat: add role analyzer service with mock fallback"
```

---

## Task 5: Write and run tests for roles endpoints

**Files:**
- Create: `career-twin/backend/tests/test_roles.py`

- [ ] **Step 1: Write the failing tests** (router doesn't exist yet — tests will fail on import)

```python
# career-twin/backend/tests/test_roles.py
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
```

- [ ] **Step 2: Run tests — expect failure** (routes not registered yet)

```bash
cd career-twin/backend && .venv/bin/pytest tests/test_roles.py -v 2>&1 | tail -20
```
Expected: FAILED — routes return 404 or 405 because the router isn't in `main.py` yet.

---

## Task 6: Roles API router + wire into main

**Files:**
- Create: `career-twin/backend/app/api/roles.py`
- Modify: `career-twin/backend/app/main.py`

- [ ] **Step 1: Create the router**

```python
# career-twin/backend/app/api/roles.py
from fastapi import APIRouter, HTTPException
from app.models.analysis import (
    SuggestRolesRequest,
    SuggestRolesResponse,
    AnalyzeRoleFitRequest,
    AnalyzeRoleFitResponse,
)
from app.services.role_suggester import suggest_roles
from app.services.role_analyzer import analyze_role_fit
from app.utils.store import get_profile

router = APIRouter()


@router.post("/suggest-roles", response_model=SuggestRolesResponse)
def suggest_roles_endpoint(body: SuggestRolesRequest):
    profile = get_profile(body.profile_id)
    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Profile not found. Please upload your CV again.",
        )
    try:
        roles = suggest_roles(profile)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Role suggestion failed: {str(e)}")
    return SuggestRolesResponse(roles=roles)


@router.post("/analyze-role-fit", response_model=AnalyzeRoleFitResponse)
def analyze_role_fit_endpoint(body: AnalyzeRoleFitRequest):
    profile = get_profile(body.profile_id)
    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Profile not found. Please upload your CV again.",
        )
    try:
        result = analyze_role_fit(profile, body.selected_role)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Role analysis failed: {str(e)}")
    return result
```

- [ ] **Step 2: Add roles router to main.py**

In `career-twin/backend/app/main.py`, add after the existing router imports:

```python
from app.api.roles import router as roles_router
```

And after `app.include_router(profile_router)`:

```python
app.include_router(roles_router)
```

- [ ] **Step 3: Run tests — expect all pass**

```bash
cd career-twin/backend && .venv/bin/pytest tests/test_roles.py -v
```
Expected:
```
tests/test_roles.py::test_suggest_roles_returns_three_roles PASSED
tests/test_roles.py::test_suggest_roles_404_on_unknown_profile PASSED
tests/test_roles.py::test_analyze_role_fit_returns_all_required_fields PASSED
tests/test_roles.py::test_analyze_role_fit_accepts_custom_role_text PASSED
tests/test_roles.py::test_analyze_role_fit_404_on_unknown_profile PASSED
5 passed
```

- [ ] **Step 4: Run full test suite to confirm no regressions**

```bash
cd career-twin/backend && .venv/bin/pytest -v 2>&1 | tail -10
```
Expected: all previously passing tests still pass.

- [ ] **Step 5: Commit**

```bash
git add career-twin/backend/app/api/roles.py career-twin/backend/app/main.py career-twin/backend/tests/test_roles.py
git commit -m "feat: POST /suggest-roles and POST /analyze-role-fit with tests"
```

---

## Task 7: Frontend types and API client

**Files:**
- Modify: `career-twin/frontend/lib/types.ts`
- Modify: `career-twin/frontend/lib/api.ts`

- [ ] **Step 1: Add types to types.ts**

Append to `career-twin/frontend/lib/types.ts`:

```typescript
export interface RoleSuggestion {
  id: string;
  title: string;
  short_description: string;
  preview_match_score: number;
}

export interface SuggestRolesResponse {
  roles: RoleSuggestion[];
}

export interface AnalyzeRoleFitResponse {
  selected_role: Record<string, unknown>;
  match_score: Record<string, unknown>;
  score_breakdown: Record<string, unknown>;
  strengths: string[];
  weaknesses: string[];
  matched_skills: string[];
  missing_skills: string[];
  readiness_summary: Record<string, unknown>;
  priority_improvements: string[];
  learning_steps: string[];
  possible_projects: string[];
  resume_improvements: string[];
  alternative_roles: string[];
  goal_pathway: Record<string, unknown>;
  evidence_items: string[];
}
```

- [ ] **Step 2: Add API functions to api.ts**

Append to `career-twin/frontend/lib/api.ts`:

```typescript
export async function suggestRoles(profileId: string): Promise<SuggestRolesResponse> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/suggest-roles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile_id: profileId }),
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

export async function analyzeRoleFit(
  profileId: string,
  selectedRole: string
): Promise<AnalyzeRoleFitResponse> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/analyze-role-fit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile_id: profileId, selected_role: selectedRole }),
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

Also add the new imports at the top of `api.ts` (update the existing import line):

```typescript
import type { CVProfile, UploadResponse, ConfirmResponse, SuggestRolesResponse, AnalyzeRoleFitResponse } from "./types";
```

- [ ] **Step 3: Check TypeScript compiles**

```bash
cd career-twin/frontend && npx tsc --noEmit 2>&1
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add career-twin/frontend/lib/types.ts career-twin/frontend/lib/api.ts
git commit -m "feat: add role and analysis types + API client functions"
```

---

## Task 8: RoleCard component

**Files:**
- Create: `career-twin/frontend/components/roles/RoleCard.tsx`

- [ ] **Step 1: Create the component**

```tsx
// career-twin/frontend/components/roles/RoleCard.tsx
import type { RoleSuggestion } from "@/lib/types";

interface RoleCardProps {
  role: RoleSuggestion;
  selected: boolean;
  onSelect: (id: string) => void;
}

export function RoleCard({ role, selected, onSelect }: RoleCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(role.id)}
      className={[
        "flex flex-col items-center gap-3 rounded-2xl border-2 p-6 text-center",
        "transition-all duration-150 cursor-pointer w-full",
        selected
          ? "border-blue-500 bg-blue-50 shadow-md"
          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm",
      ].join(" ")}
    >
      {/* Score badge */}
      <div
        className={[
          "flex h-14 w-14 items-center justify-center rounded-full text-lg font-extrabold",
          selected ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-600",
        ].join(" ")}
      >
        {role.preview_match_score}%
      </div>

      <div>
        <p className={["font-bold text-base", selected ? "text-blue-900" : "text-slate-800"].join(" ")}>
          {role.title}
        </p>
        <p className="mt-1 text-sm text-slate-500 leading-snug">{role.short_description}</p>
      </div>

      {selected && (
        <span className="rounded-full bg-blue-500 px-3 py-0.5 text-xs font-semibold text-white">
          Selected ✓
        </span>
      )}
    </button>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add career-twin/frontend/components/roles/RoleCard.tsx
git commit -m "feat: RoleCard component"
```

---

## Task 9: Roles page

**Files:**
- Create: `career-twin/frontend/app/roles/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
// career-twin/frontend/app/roles/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RoleCard } from "@/components/roles/RoleCard";
import { suggestRoles, analyzeRoleFit } from "@/lib/api";
import { Loader2 } from "lucide-react";
import type { RoleSuggestion } from "@/lib/types";

const ANALYSIS_MESSAGES = [
  "Analyzing your profile…",
  "Mapping skill gaps…",
  "Building your roadmap…",
  "Almost there…",
];

export default function RolesPage() {
  const router = useRouter();
  const [roles, setRoles] = useState<RoleSuggestion[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [customRole, setCustomRole] = useState("");
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisMsg, setAnalysisMsg] = useState(ANALYSIS_MESSAGES[0]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const profileId = sessionStorage.getItem("profile_id");
    if (!profileId) { router.push("/"); return; }

    suggestRoles(profileId)
      .then((data) => {
        setRoles(data.roles);
        sessionStorage.setItem("suggested_roles", JSON.stringify(data.roles));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load roles."))
      .finally(() => setLoadingRoles(false));
  }, [router]);

  function handleCardSelect(id: string) {
    setSelectedId(id);
    setCustomRole("");
  }

  function handleCustomInput(value: string) {
    setCustomRole(value);
    if (value.trim()) setSelectedId(null);
  }

  const activeRole = selectedId
    ? roles.find((r) => r.id === selectedId)?.title ?? selectedId
    : customRole.trim();

  async function handleAnalyze() {
    if (!activeRole) return;
    const profileId = sessionStorage.getItem("profile_id");
    if (!profileId) { router.push("/"); return; }

    setAnalyzing(true);
    setError(null);

    let msgIdx = 0;
    const interval = setInterval(() => {
      msgIdx = (msgIdx + 1) % ANALYSIS_MESSAGES.length;
      setAnalysisMsg(ANALYSIS_MESSAGES[msgIdx]);
    }, 1800);

    try {
      const result = await analyzeRoleFit(profileId, activeRole);
      sessionStorage.setItem("selected_role", activeRole);
      sessionStorage.setItem("analysis_result", JSON.stringify(result));
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed. Please try again.");
    } finally {
      clearInterval(interval);
      setAnalyzing(false);
    }
  }

  /* Full-screen loading overlay during analysis */
  if (analyzing) {
    return (
      <main className="fixed inset-0 flex flex-col items-center justify-center bg-white gap-6 z-50">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
        <p className="text-lg font-medium text-slate-700">{analysisMsg}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-slate-900">Your Career Paths</h1>
          <p className="text-slate-500">
            Based on your CV, here are 3 paths that suit your background. Pick one to explore.
          </p>
        </div>

        {loadingRoles ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {roles.map((role) => (
                <RoleCard
                  key={role.id}
                  role={role}
                  selected={selectedId === role.id}
                  onSelect={handleCardSelect}
                />
              ))}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-600 text-center">
                Or describe your own target role
              </p>
              <input
                type="text"
                value={customRole}
                onChange={(e) => handleCustomInput(e.target.value)}
                placeholder="e.g. Product Manager at a fintech startup"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <button
              onClick={handleAnalyze}
              disabled={!activeRole}
              className="w-full rounded-xl bg-blue-600 py-3 text-white font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Analyze my fit →
            </button>
          </>
        )}

        {error && (
          <p className="text-sm text-center text-red-500">{error}</p>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Manual verification**

Start both servers, go through the full flow:
1. Upload a PDF → Review → Confirm → you should land on `/roles`
2. Check that 3 role cards appear with scores
3. Click a card — verify it shows "Selected ✓" and score turns blue
4. Clear card selection by typing in the custom input field
5. Click "Analyze my fit →" — verify the loading overlay appears with cycling messages
6. Confirm you land on `/dashboard` (404 is expected until Task 13)

- [ ] **Step 3: Commit**

```bash
git add career-twin/frontend/app/roles/page.tsx
git commit -m "feat: role selection page with cards, custom input, and analysis loading"
```

---

## Task 10: Dashboard LeftSidebar

**Files:**
- Create: `career-twin/frontend/components/dashboard/LeftSidebar.tsx`

- [ ] **Step 1: Create the component**

```tsx
// career-twin/frontend/components/dashboard/LeftSidebar.tsx
import type { RoleSuggestion } from "@/lib/types";

interface LeftSidebarProps {
  candidateName: string;
  roles: RoleSuggestion[];
  selectedRole: string;
}

export function LeftSidebar({ candidateName, roles, selectedRole }: LeftSidebarProps) {
  return (
    <aside className="flex flex-col gap-4 p-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Candidate</p>
        <p className="mt-1 font-semibold text-slate-800 truncate">{candidateName || "—"}</p>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Career Paths</p>
        <ul className="space-y-1">
          {roles.map((role) => {
            const isActive = role.title === selectedRole || role.id === selectedRole;
            return (
              <li key={role.id}>
                <div
                  className={[
                    "rounded-lg px-3 py-2",
                    isActive ? "bg-blue-500 text-white" : "text-slate-600 hover:bg-slate-100",
                  ].join(" ")}
                >
                  <p className="text-sm font-medium truncate">{role.title}</p>
                  <p className={["text-xs", isActive ? "text-blue-100" : "text-slate-400"].join(" ")}>
                    {role.preview_match_score}% match
                  </p>
                </div>
              </li>
            );
          })}
          {roles.length === 0 && (
            <li>
              <div className="rounded-lg bg-blue-500 px-3 py-2">
                <p className="text-sm font-medium text-white truncate">{selectedRole}</p>
                <p className="text-xs text-blue-100">Custom role</p>
              </div>
            </li>
          )}
        </ul>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add career-twin/frontend/components/dashboard/LeftSidebar.tsx
git commit -m "feat: dashboard LeftSidebar component"
```

---

## Task 11: Dashboard MainContent

**Files:**
- Create: `career-twin/frontend/components/dashboard/MainContent.tsx`

- [ ] **Step 1: Create the component**

```tsx
// career-twin/frontend/components/dashboard/MainContent.tsx
import type { AnalyzeRoleFitResponse } from "@/lib/types";

interface MainContentProps {
  data: AnalyzeRoleFitResponse;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</h2>
      {children}
    </div>
  );
}

function TagList({ items, color }: { items: string[]; color: "blue" | "green" | "red" | "amber" }) {
  const cls = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    red: "bg-red-50 text-red-700",
    amber: "bg-amber-50 text-amber-700",
  }[color];
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <span key={i} className={`rounded-full px-3 py-1 text-sm font-medium ${cls}`}>
          {item}
        </span>
      ))}
    </div>
  );
}

function NumberedList({ items }: { items: string[] }) {
  return (
    <ol className="list-decimal list-inside space-y-1">
      {items.map((item, i) => (
        <li key={i} className="text-sm text-slate-700 leading-relaxed">{item}</li>
      ))}
    </ol>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc list-inside space-y-1">
      {items.map((item, i) => (
        <li key={i} className="text-sm text-slate-700 leading-relaxed">{item}</li>
      ))}
    </ul>
  );
}

export function MainContent({ data }: MainContentProps) {
  const role = data.selected_role as { title?: string; description?: string };
  const score = data.match_score as { overall?: number; label?: string };
  const breakdown = data.score_breakdown as { skills?: number; experience?: number; education?: number };
  const readiness = data.readiness_summary as { level?: string; summary?: string };
  const pathway = data.goal_pathway as { short_term?: string; mid_term?: string; long_term?: string };

  return (
    <div className="p-6 pb-16">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{role.title ?? "Role Analysis"}</h1>
          {role.description && (
            <p className="mt-1 text-sm text-slate-500">{role.description}</p>
          )}
        </div>
        <div className="flex-shrink-0 rounded-xl bg-blue-500 px-4 py-2 text-center">
          <p className="text-2xl font-extrabold text-white">{score.overall ?? "—"}%</p>
          <p className="text-xs text-blue-100">{score.label ?? "Match"}</p>
        </div>
      </div>

      {/* Score breakdown */}
      {breakdown && (
        <Section title="Score Breakdown">
          <div className="grid grid-cols-3 gap-3">
            {(["skills", "experience", "education"] as const).map((key) => (
              <div key={key} className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
                <p className="text-xl font-bold text-slate-800">{breakdown[key] ?? "—"}%</p>
                <p className="text-xs text-slate-500 capitalize">{key}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Readiness */}
      <Section title="Readiness">
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <span className="inline-block rounded-full bg-blue-100 px-3 py-0.5 text-xs font-semibold text-blue-700 mb-2">
            {readiness.level ?? "—"}
          </span>
          <p className="text-sm text-slate-700 leading-relaxed">{readiness.summary ?? "—"}</p>
        </div>
      </Section>

      {/* Strengths / Weaknesses */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Strengths</p>
          <TagList items={data.strengths} color="green" />
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Weaknesses</p>
          <TagList items={data.weaknesses} color="amber" />
        </div>
      </div>

      {/* Skills */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Matched Skills</p>
          <TagList items={data.matched_skills} color="blue" />
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Missing Skills</p>
          <TagList items={data.missing_skills} color="red" />
        </div>
      </div>

      <Section title="Priority Improvements">
        <NumberedList items={data.priority_improvements} />
      </Section>

      <Section title="Learning Steps">
        <NumberedList items={data.learning_steps} />
      </Section>

      <Section title="Possible Projects">
        <div className="space-y-2">
          {data.possible_projects.map((project, i) => {
            const [name, ...rest] = project.split(":");
            return (
              <div key={i} className="rounded-xl border border-slate-100 bg-white p-4">
                <p className="font-semibold text-slate-800 text-sm">{name.trim()}</p>
                {rest.length > 0 && (
                  <p className="text-sm text-slate-500 mt-1">{rest.join(":").trim()}</p>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="Resume Improvements">
        <BulletList items={data.resume_improvements} />
      </Section>

      <Section title="Alternative Roles">
        <TagList items={data.alternative_roles} color="blue" />
      </Section>

      <Section title="Goal Pathway">
        <div className="space-y-2">
          {(["short_term", "mid_term", "long_term"] as const).map((key) => (
            pathway[key] && (
              <div key={key} className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                <span className="flex-shrink-0 text-xs font-semibold uppercase text-slate-400 w-20 pt-0.5">
                  {key.replace("_", " ")}
                </span>
                <p className="text-sm text-slate-700">{pathway[key]}</p>
              </div>
            )
          ))}
        </div>
      </Section>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add career-twin/frontend/components/dashboard/MainContent.tsx
git commit -m "feat: dashboard MainContent component"
```

---

## Task 12: Dashboard RightPanel

**Files:**
- Create: `career-twin/frontend/components/dashboard/RightPanel.tsx`

- [ ] **Step 1: Create the component**

```tsx
// career-twin/frontend/components/dashboard/RightPanel.tsx
interface RightPanelProps {
  evidenceItems: string[];
  resumeImprovements: string[];
}

export function RightPanel({ evidenceItems, resumeImprovements }: RightPanelProps) {
  return (
    <aside className="flex flex-col gap-6 p-4 border-l border-slate-100">
      {/* Regenerate */}
      <div>
        <button
          onClick={() => alert("Regeneration coming in a future phase.")}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          ↻ Regenerate analysis
        </button>
      </div>

      {/* Evidence items */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Evidence from your CV
        </p>
        <ul className="space-y-2">
          {evidenceItems.map((item, i) => (
            <li key={i} className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600 leading-relaxed">
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* CV tips */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          CV Tips
        </p>
        <ul className="space-y-2">
          {resumeImprovements.map((tip, i) => (
            <li key={i} className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 leading-relaxed">
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add career-twin/frontend/components/dashboard/RightPanel.tsx
git commit -m "feat: dashboard RightPanel component"
```

---

## Task 13: Dashboard page

**Files:**
- Create: `career-twin/frontend/app/dashboard/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
// career-twin/frontend/app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LeftSidebar } from "@/components/dashboard/LeftSidebar";
import { MainContent } from "@/components/dashboard/MainContent";
import { RightPanel } from "@/components/dashboard/RightPanel";
import type { AnalyzeRoleFitResponse, RoleSuggestion } from "@/lib/types";

export default function DashboardPage() {
  const router = useRouter();
  const [analysis, setAnalysis] = useState<AnalyzeRoleFitResponse | null>(null);
  const [roles, setRoles] = useState<RoleSuggestion[]>([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [candidateName, setCandidateName] = useState("");

  useEffect(() => {
    const raw = sessionStorage.getItem("analysis_result");
    if (!raw) { router.push("/roles"); return; }

    setAnalysis(JSON.parse(raw));

    const rolesRaw = sessionStorage.getItem("suggested_roles");
    if (rolesRaw) setRoles(JSON.parse(rolesRaw));

    const role = sessionStorage.getItem("selected_role");
    if (role) setSelectedRole(role);

    const profileRaw = sessionStorage.getItem("confirmed_profile");
    if (profileRaw) {
      try {
        setCandidateName(JSON.parse(profileRaw).name ?? "");
      } catch { /* ignore */ }
    }
  }, [router]);

  if (!analysis) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* Left sidebar */}
      <div className="w-52 flex-shrink-0 overflow-y-auto border-r border-slate-100 bg-slate-50">
        <LeftSidebar
          candidateName={candidateName}
          roles={roles}
          selectedRole={selectedRole}
        />
      </div>

      {/* Main scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <MainContent data={analysis} />
      </div>

      {/* Right panel */}
      <div className="w-60 flex-shrink-0 overflow-y-auto bg-slate-50">
        <RightPanel
          evidenceItems={analysis.evidence_items}
          resumeImprovements={analysis.resume_improvements}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Manual end-to-end verification**

With both servers running, run through the full flow:

1. Go to `http://localhost:3000` → upload a PDF
2. Review page → click "Confirm CV →"
3. Roles page → 3 cards load → select one → click "Analyze my fit →"
4. Loading overlay shows with cycling messages
5. Dashboard loads with 3 columns:
   - Left: candidate name + role list with scores
   - Main: role title, match score badge, all analysis sections
   - Right: evidence items + CV tips
6. Verify all sections have content (not empty arrays)
7. Verify the "Regenerate analysis" button shows an alert
8. Resize to mobile width (~375px) — columns should stack vertically (flex-shrink handles this; add `flex-wrap` if needed)

- [ ] **Step 3: Edge case — no analysis_result in sessionStorage**

Open `http://localhost:3000/dashboard` directly in a new tab (no prior session). Should redirect to `/roles`.

- [ ] **Step 4: Commit**

```bash
git add career-twin/frontend/app/dashboard/page.tsx
git commit -m "feat: dashboard page with 3-column layout"
```

---

## Task 14: Final cleanup

- [ ] **Step 1: Add .superpowers/ to .gitignore**

Open `.gitignore` (create it at project root if it doesn't exist) and add:

```
.superpowers/
```

- [ ] **Step 2: Run full backend test suite one final time**

```bash
cd career-twin/backend && .venv/bin/pytest -v 2>&1 | tail -15
```
Expected: all tests pass.

- [ ] **Step 3: Update session log**

Update `career-twin/.claude/.claude-session-log.md` (or `.claude/.claude-session-log.md`) with:
- What was completed (Phases 4–6: role suggestion, dashboard, analysis engine)
- Blockers: none expected
- Next step: Phase 7 (lean RAG helpers — optional) or Phase 8 (project detail + roadmap)

- [ ] **Step 4: Final commit**

```bash
git add .gitignore
git commit -m "chore: add .superpowers/ to .gitignore"
```
