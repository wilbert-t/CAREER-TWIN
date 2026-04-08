# Project Detail Popup — Design Spec
**Date:** 2026-04-08  
**Status:** Approved

---

## Overview

When a user clicks any project card in the "Possible Projects" section of the dashboard, a modal popup opens showing a rich, LLM-generated breakdown of that project. The detail is generated on-demand (only on click) to avoid wasted API calls. The popup is dismissed by pressing Escape or clicking the backdrop.

---

## Backend

### New endpoint: `POST /expand-project`

**Request body:**
```json
{
  "profile_id": "string",
  "role": "string",
  "project_name": "string",
  "short_description": "string"
}
```

**Response body:**
```json
{
  "name": "string",
  "short_description": "string",
  "difficulty": 1-5,
  "uniqueness": 1-5,
  "duration": "e.g. 1–2 weeks",
  "description": "string (3–5 sentences, detailed)",
  "objectives": "string (2–3 sentences — why this project helps the candidate for this role)",
  "tools_required": ["tool1", "tool2", "..."]
}
```

**Service:** `career-twin/backend/app/services/project_expander.py`
- Loads profile from store using `profile_id`
- Truncates `profile.raw_text` to **2000 chars**
- Builds prompt from `PROJECT_EXPAND_PROMPT` template
- Calls Groq llama-3.3-70b-versatile (same pattern as `role_analyzer.py`)
- Falls back to mock if no `GROQ_API_KEY`

**Prompt:** `career-twin/backend/app/prompts/expand_project.py`  
Template variables: `{role}`, `{raw_text}`, `{project_name}`, `{short_description}`

Prompt instructs:
- `difficulty`: integer 1–5. 1 = beginner weekend project, 5 = senior multi-system build
- `uniqueness`: integer 1–5. 1 = very common/seen everywhere, 5 = rare and distinctive for portfolio
- `duration`: realistic string like "1–2 weeks", "2–3 weeks", "3–5 weeks"
- `description`: detailed paragraph explaining what the project builds, what problem it solves, and what the end result looks like
- `objectives`: explain specifically why this project strengthens the candidate's position for the target role and what they will learn/demonstrate
- `tools_required`: exhaustive list of languages, frameworks, libraries, APIs, and services the project would realistically use

**Pydantic model:** `ExpandProjectRequest` and `ExpandProjectResponse` added to `analysis.py`

**Route registration:** added to `roles.py` router

---

## Frontend

### Type: `ProjectDetail` in `lib/types.ts`
```ts
export interface ProjectDetail {
  name: string;
  short_description: string;
  difficulty: number;      // 1-5
  uniqueness: number;      // 1-5
  duration: string;
  description: string;
  objectives: string;
  tools_required: string[];
}
```

### API call: `expandProject` in `lib/api.ts`
- `POST /expand-project`
- Takes `profileId`, `role`, `projectName`, `shortDescription`

### New component: `ProjectDetailModal.tsx`
Location: `career-twin/frontend/components/dashboard/ProjectDetailModal.tsx`

**Props:**
```ts
interface ProjectDetailModalProps {
  project: ProjectDetail | null;   // null = loading state
  projectName: string;             // shown immediately, before detail loads
  onClose: () => void;
}
```

**Layout (matches sketch):**
1. **Header row:** project name (bold, large) + close button (×)
2. **Badges row:** three pill badges side by side
   - Difficulty: `★★★☆☆` (filled stars out of 5)
   - Uniqueness: `★★★★☆`
   - Duration: plain text badge e.g. `2–3 weeks`
3. **Description block:** label "Description" + paragraph text
4. **Objectives block:** label "Objectives" + paragraph text
5. **Tools Required block:** label "Tools Required" + tag chips (same style as TagList in MainContent)

**Loading state:** while LLM call is in-flight, show the project name in the header and skeleton placeholders (grey animated bars) for badges, description, objectives, and tools.

**Backdrop:** semi-transparent dark overlay (`bg-black/40`). Click outside closes the modal.

**Keyboard:** `Escape` closes the modal (useEffect event listener).

**Scroll:** modal body scrolls if content overflows; backdrop is fixed to viewport.

### Changes to `MainContent.tsx`
- Each project card gets an `onClick` handler
- Cards show a subtle hover state (`hover:border-slate-300 hover:bg-slate-50 cursor-pointer`)
- `MainContent` receives two new props: `onProjectClick(name, shortDescription)` and `profileId`
- `MainContent` owns the modal open/close state and the `ProjectDetail` data

### Changes to `dashboard/page.tsx`
- Pass `profileId` and `onProjectClick` handler down to `MainContent`
- `onProjectClick` fires `expandProject(...)` and sets the modal detail state inside `MainContent`

---

## Data Flow

```
User clicks project card
  → MainContent.onProjectClick(name, shortDesc)
  → setModalOpen(true), setModalDetail(null)  [shows loading modal immediately]
  → expandProject(profileId, role, name, shortDesc)
  → POST /expand-project → Groq LLM (CV truncated to 2000 chars)
  → setModalDetail(result)  [loading skeleton replaced with real content]

User presses Escape or clicks backdrop
  → setModalOpen(false), setModalDetail(null)
```

---

## Error Handling

- If the API call fails, show a brief error message inside the modal ("Couldn't load project details. Try again.") with a Retry button
- No toast/global error — error is scoped to the modal

---

## Token Budget

| Input component | Approx tokens |
|---|---|
| Prompt instructions | ~400 |
| CV raw text (capped 2000 chars) | ~650 |
| Role + project name/description | ~30 |
| **Total input** | **~1080** |
| JSON output | ~350 |
| **Total per call** | **~1430** |

Cost per call on Groq: < $0.001. Safe for demo and production use.

---

## Out of Scope

- Saving/bookmarking project details
- Sharing or exporting the project breakdown
- Generating code scaffolds from the project detail
- Caching project detail between sessions (sessionStorage caching is a future nice-to-have)
