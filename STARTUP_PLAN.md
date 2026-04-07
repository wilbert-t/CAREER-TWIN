# Career Twin – 2‑Day Startup Plan (Claude Code Build Mode)

## 0. Tech Stack

**Frontend**
- Next.js (App Router, TypeScript)
- React
- Tailwind CSS
- shadcn/ui
- Lucide icons

**Backend**
- FastAPI
- Pydantic
- Uvicorn
- PyMuPDF / pdfplumber (CV parsing)
- httpx (LLM calls)
- Optional: ChromaDB + sentence-transformers (lean retrieval)

**LLM**
- Groq `llama-3.3-70b-versatile` (primary)
- Gemma or smaller model as fallback

**Dev**
- GitHub
- `docs/`, `.claude-session-log.md`, `.claude-lessons.md` for supervision

---

## 1. Product Definition

**Career Twin** is a CV-to-career guidance web app:

Flow:
1. Upload CV (PDF/DOCX).
2. Review and edit parsed CV.
3. Select target role (3 suggestions + custom).
4. Open one main dashboard with all analysis.

Dashboard shows:
- Match score for chosen role.
- Strengths / weaknesses with evidence.
- Matched vs missing skills.
- Readiness summary.
- Action plan and learning steps.
- Possible projects.
- Resume improvements.
- Alternative roles.
- Goal pathway.

**Demo goal:** one clean, believable, polished end-to-end flow in 2 days.

---

## 2. Repo Structure

```text
career-twin/
  frontend/
    app/
    components/
    lib/
    hooks/
  backend/
    app/
      api/
      services/
      models/
      prompts/
      rag/
      utils/
  knowledge_base/
    roles_tech.jsonl
    roles_business.jsonl
    skills_map.jsonl
    project_ideas.jsonl
    career_trajectories.jsonl
  docs/
  .claude-session-log.md
  .claude-lessons.md
  CLAUDE.md
  AGENTS.md
```

---

## 3. Must-Haves & Cuts

**Must-have by demo:**
- PDF/DOCX upload.
- CV extraction.
- Parsed CV review/edit step.
- Role suggestion + custom role.
- One desktop-style dashboard.
- Match score.
- Strengths & weaknesses.
- Matched vs missing skills.
- Action plan + learning steps.
- At least 3 project ideas.
- Resume improvements.
- Alternative roles.
- Goal pathway.

**Cut first if time is short:**
1. Extra sidebar filters.
2. Advanced compare-role interactions.
3. Export.
4. Fancy animations.
5. Deep chat refinement.
6. Too many alternative roles.
7. Heavy RAG.

---

## 4. Day 1 – Core Flow

### Phase 1 – Setup & Bootstrap (1.5h)

#### 💬 Claude Code Task – Initialize Project

```bash
mkdir -p career-twin/{frontend,backend,knowledge_base,docs}
mkdir -p career-twin/frontend/{app,components,lib,hooks}
mkdir -p career-twin/backend/app/{api,services,models,prompts,rag,utils}
cd career-twin
```

- `frontend`: Next.js App Router + Tailwind + shadcn/ui.
- `backend`: FastAPI app with `/health`.

#### 💬 Claude Code Task – Frontend Bootstrap

- Create Next.js app in `frontend` (TypeScript).
- Install Tailwind CSS.
- Install shadcn/ui.
- Install Lucide icons.

#### 💬 Claude Code Task – Backend Bootstrap

- Install FastAPI, uvicorn, pydantic, httpx, PyMuPDF, pdfplumber, python-dotenv.
- Create minimal FastAPI app with `GET /health`.

#### 💬 Claude Code Task – Env Template

```env
GROQ_API_KEY=
GEMMA_API_KEY=
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
PYTHON_ENV=development
```

#### 🎬 Cowork Task

1. Create `.env` from template.
2. Run backend (`uvicorn`).
3. Hit `/health`.
4. Run frontend dev server.

#### 📝 Verify

- [ ] Frontend loads.
- [ ] Backend `/health` returns OK.
- [ ] Env file checked in as `.env.example`.
- [ ] Commit: `git add . && git commit -m "Init: scaffold frontend+backend"`.

---

### Phase 2 – Step 1: Upload CV (2h)

#### 💬 Claude Code Task – `POST /upload-cv`

- Accept `multipart/form-data` with file.
- Allow pdf, docx.
- Extract text with PyMuPDF (fallback pdfplumber).
- Return:
```json
{
  "raw_text": "...",
  "structured": {
    "name": "",
    "headline": "",
    "summary": "",
    "experience": [],
    "education": [],
    "skills": [],
    "projects": [],
    "certificates": [],
    "leadership": []
  }
}
```

#### 💬 Claude Code Task – Upload Page

- Landing with:
  - Product name.
  - One main “Upload CV” CTA.
  - Drag-and-drop area.
  - Loading messages: “Reading your CV…”, “Structuring your profile…”.
- On success, navigate to `/review` with parsed data in state.

#### 🎬 Cowork Task

1. Upload at least one PDF and one DOCX.
2. Confirm `raw_text` and `structured` sections look right.
3. Try an invalid file (e.g., `.png`) and observe error.

#### 📝 Verify

- [ ] Upload works for PDF.
- [ ] Upload works for DOCX.
- [ ] Structured JSON present for key fields.
- [ ] Invalid file gives clean error.
- [ ] Commit: `git add . && git commit -m "Feature: CV upload + parsing"`.

---

### Phase 3 – Step 2: Review Parsed CV (2h)

#### 💬 Claude Code Task – Review Page UI

- Editable fields:
  - Name, Headline, Summary.
  - Experience.
  - Education.
  - Skills.
  - Projects.
  - Certificates.
  - Leadership / extracurriculars.
- Optional raw-text textarea at bottom.
- “Confirm CV” primary button.

#### 💬 Claude Code Task – `POST /confirm-profile`

- Accept structured profile JSON.
- Validate with Pydantic model.
- Store in-memory (or simple store), return `profile_id`.

#### 🎬 Cowork Task

1. Edit multiple fields (skills, job title, summary).
2. Click “Confirm CV”.
3. Confirm backend receives updated structure.

#### 📝 Verify

- [ ] All key fields editable.
- [ ] Confirm route returns `profile_id`.
- [ ] Bad payload returns readable error.
- [ ] Commit: `git add . && git commit -m "Feature: CV review + confirm profile"`.

---

# until here.

### Phase 4 – Step 3: Role Selection (1.5–2h)

#### 💬 Claude Code Task – `POST /suggest-roles`

- Input: `profile_id`.
- Use LLM to return 3 suggested roles and also section where they can pick or suggest their own roles.:
  - `id`, `title`, `short_description`, `preview_match_score`.

#### 💬 Claude Code Task – Role Selection Page

- UI:
  - 3 role cards with title, description, preview score.
  - Custom desired-role text input.
  - One selected state (card or custom string).
  - “Open Dashboard” CTA.
- On submit: call `/analyze-role-fit` and navigate to `/dashboard` when ready.

#### 🎬 Cowork Task

1. Confirm profile.
2. Go to role selection.
3. Select suggested role, then test custom role.
4. Verify `/analyze-role-fit` request triggers.

#### 📝 Verify

- [ ] 3 roles returned consistently for sample profile.
- [ ] Custom role flows through correctly.
- [ ] Commit: `git add . && git commit -m "Feature: role suggestion + selection"`.

---

### Phase 5 – Step 4: Dashboard Shell (1.5–2h)

#### 💬 Claude Code Task – 3-Column Layout

- Left sidebar (~20%):
  - Role list with scores.
  - Custom role entry (read-only for now).
- Main content (~55–60%):
  - Role header.
  - Match score block.
  - Strengths / weaknesses.
  - Matched / missing skills.
  - Readiness.
  - Action plan.
  - Learning steps.
  - Possible projects.
  - Resume improvements.
  - Alternative roles.
  - Goal pathway.
- Right panel (~20–25%):
  - Recommended actions.
  - Evidence viewer.
  - Utilities (regenerate, rewrite, improve).

Use mock JSON to drive all components.

#### 🎬 Cowork Task

1. Open `/dashboard` with mock data.
2. Check at desktop width (≥1280px).
3. Check mobile (collapsed columns / stacked layout).

#### 📝 Verify

- [ ] All sections visible with mock content.
- [ ] Layout feels like one coherent dashboard.
- [ ] Commit: `git add . && git commit -m "Feature: dashboard shell with mock data"`.

---

## 5. Day 2 – Intelligence & Integration

### Phase 6 – Combined Analysis Engine (2–3h)

#### 💬 Claude Code Task – `POST /analyze-role-fit`

Input:
- `profile_id`
- `selected_role` (id or string)

Output:

```json
{
  "selected_role": {},
  "match_score": {},
  "score_breakdown": {},
  "strengths": [],
  "weaknesses": [],
  "matched_skills": [],
  "missing_skills": [],
  "readiness_summary": {},
  "priority_improvements": [],
  "learning_steps": [],
  "possible_projects": [],
  "resume_improvements": [],
  "alternative_roles": [],
  "goal_pathway": {},
  "evidence_items": []
}
```

#### 💬 Claude Code Task – Prompt Blocks

Create prompt templates / functions for:

- CV Structuring Prompt.
- Role Suggestion Prompt.
- Role Fit Analysis Prompt.
- Strengths & Weaknesses Prompt.
- Skills Gap Prompt.
- Learning Steps Prompt.
- Project Suggestion Prompt.
- Resume Improvement Prompt.
- Alternative Roles Prompt.
- Goal Pathway Prompt.

You can still call the LLM once with a combined instruction that yields this JSON, but keep logic modular.

#### 🎬 Cowork Task

1. Call `/analyze-role-fit` with one profile and role.
2. Inspect JSON structure.
3. Check each list contains non-empty, believable content.

#### 📝 Verify

- [ ] Response matches schema exactly.
- [ ] No missing keys.
- [ ] Outputs are coherent.
- [ ] Commit: `git add . && git commit -m "Feature: combined role-fit engine"`.

---

### Phase 7 – Optional Lean Retrieval (1.5–2h, skip if needed)

#### 💬 Claude Code Task – Knowledge Base

Create small JSONL files:

- `roles_tech.jsonl`
- `roles_business.jsonl`
- `skills_map.jsonl`
- `project_ideas.jsonl`
- `career_trajectories.jsonl`

#### 💬 Claude Code Task – Minimal Helpers

Implement optional helpers:

- `retrieve_roles(profile)`
- `retrieve_projects(role)`
- `retrieve_trajectories(role)`

Use only to assist prompts; demo must not depend on RAG.

#### 🎬 Cowork Task

1. Test retrieval for a tech role.
2. Test retrieval for a business role.
3. Confirm app still works if retrieval is off/noisy.

#### 📝 Verify

- [ ] Retrieval is small and fast.
- [ ] No hard dependency for demo.
- [ ] Commit: `git add . && git commit -m "Chore: lean KB + retrieval helpers"`.

---

### Phase 8 – Live Dashboard Integration (2–3h)

#### 💬 Claude Code Task – Wire Dashboard to API

Replace all mock data with `analyze-role-fit` response:

- Role header ← `selected_role`
- Match score ← `match_score`, `score_breakdown`
- Strengths/weaknesses ← `strengths`, `weaknesses`
- Skills gap ← `matched_skills`, `missing_skills`
- Readiness ← `readiness_summary`
- Action plan ← `priority_improvements`
- Learning steps ← `learning_steps`
- Projects ← `possible_projects`
- Resume hints ← `resume_improvements`
- Alternatives ← `alternative_roles`
- Pathway ← `goal_pathway`
- Evidence viewer ← `evidence_items`

#### 💬 Claude Code Task – Utility Tools Row

Add top tools row:

- Role switcher.
- Simple compare-role toggle (V1 can just show second role’s scores).
- Regenerate suggestions button.
- Rewrite CV bullets button (light call to resume improvements).
- Improve summary button.
- Evidence filter: CV / projects / certificates.

All must be lightweight, no complex new sub-systems.

#### 🎬 Cowork Task

1. Run full flow: Upload → Review → Role select → Dashboard.
2. Change role from sidebar and re-run analysis.
3. Test regenerate and one rewrite/improve action.

#### 📝 Verify

- [ ] End-to-end flow works with real data.
- [ ] Dashboard feels unified, not like separate pages.
- [ ] Utilities work or degrade gracefully.
- [ ] Commit: `git add . && git commit -m "Feature: live dashboard + tools row"`.

---

### Phase 9 – Fallbacks & Demo Prep (2–2.5h)

#### 💬 Claude Code Task – Error & Fallback UX

- Upload:
  - Bad file → clean error message.
  - Huge file → safe error.
- Parsing:
  - Weak parse → show raw text + editing.
- LLM:
  - Timeout / error → short fallback text block, no crash.
- Global:
  - No raw stack traces; only friendly, user-facing messages.

#### 💬 Claude Code Task – Demo Script

Create `docs/DEMO_FLOW.md`:

- Setup steps.
- Demo script:
  1. Upload hero CV.
  2. Fix one thing in review.
  3. Show role suggestions.
  4. Open dashboard.
  5. Walk through sections: match, strengths/gaps, skills, plan, projects, resume, alternatives, pathway.
  6. Use one utility action (e.g., improve summary).

- Notes: avoid extremely weird CV formats.

#### 🎬 Cowork Task

1. Test 3 CVs:
   - Technical student.
   - Business student.
   - Hybrid.
2. Pick best “hero” CV for demo.
3. Prepare backup static JSON demo path (feature flag or query param).

#### 📝 Verify

- [ ] At least 3 CVs tested end-to-end.
- [ ] One hero demo path chosen.
- [ ] Backup mock JSON wired as fallback.
- [ ] Final commit: `git add . && git commit -m "Polish: fallbacks + demo-ready"`.

---

## 6. Validation Rules & Working Ritual

Before marking any phase done:

- Run the code, ensure no errors.
- Spot-check response structure and key fields.
- Test one edge case.
- Update `.claude-session-log.md`.
- Add at least one lesson to `.claude-lessons.md`.

Working mode each session:
1. Read `.claude-session-log.md`.
2. Read last lessons from `.claude-lessons.md`.
3. Write a 3-step micro-plan.
4. Execute exactly one phase.
5. Run the Verify checklist before moving on.