# Design: Phases 4–6 — Role Suggestion, Dashboard Shell, Analysis Engine

**Date:** 2026-04-07  
**Status:** Approved  
**Scope:** Phase 4 (role suggestion + selection), Phase 5 (dashboard shell), Phase 6 (combined analysis engine)

---

## Overview

After a user confirms their CV profile they are shown 3 AI-suggested career roles, select one (or enter a custom role), wait while the system analyzes their fit, then land on a dashboard showing the full analysis. All three phases are implemented together because the dashboard is driven entirely by the `/analyze-role-fit` response — there is no value in a mock-only dashboard that then needs to be rewired.

---

## User Flow

```
/review → confirm → /roles → select role → analyze (loading) → /dashboard
```

sessionStorage chain:
- `upload_result` — set by upload page
- `profile_id` — set by review page after confirm
- `confirmed_profile` — set by review page
- `suggested_roles` — set by roles page after `/suggest-roles`
- `selected_role` — set by roles page on submit
- `analysis_result` — set by roles page after `/analyze-role-fit`, read by dashboard

---

## Backend

### New file: `app/models/analysis.py`

```python
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
    selected_role: str  # role id or free-text custom role

class AnalyzeRoleFitResponse(BaseModel):
    selected_role: dict
    match_score: dict
    score_breakdown: dict
    strengths: list[str]
    weaknesses: list[str]
    matched_skills: list[str]
    missing_skills: list[str]
    readiness_summary: dict
    priority_improvements: list[str]
    learning_steps: list[str]
    possible_projects: list[str]
    resume_improvements: list[str]
    alternative_roles: list[str]
    goal_pathway: dict
    evidence_items: list[str]
```

### New file: `app/services/role_suggester.py`

- `suggest_roles(profile: CVProfile) -> list[RoleSuggestion]`
- One LLM call to Groq using `SUGGEST_ROLES_PROMPT`
- Strips markdown fences before `json.loads` (same pattern as cv_structurer)
- Mock fallback returns 3 hardcoded roles when `GROQ_API_KEY` is empty

### New file: `app/services/role_analyzer.py`

- `analyze_role_fit(profile: CVProfile, role: str) -> AnalyzeRoleFitResponse`
- One LLM call to Groq using `ANALYZE_ROLE_FIT_PROMPT`
- Returns the full analysis JSON in a single prompt
- Strips markdown fences before `json.loads`
- Mock fallback returns a complete hardcoded `AnalyzeRoleFitResponse`

### New file: `app/prompts/suggest_roles.py`

`SUGGEST_ROLES_PROMPT` — instructs LLM to return a JSON array of 3 roles with `id`, `title`, `short_description`, `preview_match_score` based on the candidate's skills and experience. Return only valid JSON.

### New file: `app/prompts/analyze_role_fit.py`

`ANALYZE_ROLE_FIT_PROMPT` — instructs LLM to return the full analysis JSON object (all 15 fields) for the given candidate and role in one shot. Return only valid JSON.

### New file: `app/api/roles.py`

```
POST /suggest-roles
  body: { profile_id }
  → looks up profile from store, 404 if missing
  → calls suggest_roles(profile)
  → returns SuggestRolesResponse

POST /analyze-role-fit
  body: { profile_id, selected_role }
  → looks up profile from store, 404 if missing
  → calls analyze_role_fit(profile, selected_role)
  → returns AnalyzeRoleFitResponse
```

Both routes wrap the service call in try/except and return HTTP 500 with a detail message on failure (same pattern as upload route).

### Updated: `app/main.py`

Include the new roles router.

---

## Frontend

### Updated: `lib/types.ts`

Add:
- `RoleSuggestion`
- `SuggestRolesResponse`
- `AnalyzeRoleFitResponse` (all 15 fields typed as appropriate — arrays of strings, dicts as `Record<string, unknown>`)

### Updated: `lib/api.ts`

Add:
- `suggestRoles(profileId: string): Promise<SuggestRolesResponse>`
- `analyzeRoleFit(profileId: string, selectedRole: string): Promise<AnalyzeRoleFitResponse>`

Both follow the same fetch + error-handling pattern as `uploadCV`.

### New: `app/roles/page.tsx`

**Mount:** read `profile_id` from sessionStorage → redirect to `/` if missing → call `suggestRoles` → store result in `sessionStorage("suggested_roles")` → render cards.

**Role cards (3-column vertical grid):**
- Each card shows: title, short description, preview match score as a circle badge
- Selected state: blue border + tinted background
- Selecting a card clears the custom input; typing in custom input clears card selection

**Custom role input:** text field below the cards — "Or describe your own target role…"

**CTA button:** "Analyze my fit →" — disabled until a role is selected or custom text is entered.

**On submit:**
1. Store selected role in `sessionStorage("selected_role")`
2. Show full-screen loading overlay with cycling messages: "Analyzing your profile…" / "Mapping skill gaps…" / "Building your roadmap…" (1800ms interval, same pattern as upload page)
3. Call `analyzeRoleFit(profileId, selectedRole)`
4. On success: store result in `sessionStorage("analysis_result")`, navigate to `/dashboard`
5. On error: clear loading, show error message

### New: `app/dashboard/page.tsx`

**Mount:** read `analysis_result` from sessionStorage → redirect to `/` if missing → render layout.

**Layout — 3 columns (fixed, no tabs):**

```
[Left 20%] | [Main 58%] | [Right 22%]
```

**Left sidebar:**
- Heading: candidate name from `confirmed_profile`
- List of suggested roles from `suggested_roles` with preview scores
- Currently selected role highlighted in blue
- (Switching roles in sidebar is out of scope for this phase — sidebar is read-only)

**Main content (scrollable):**
1. Role title + match score badge
2. Score breakdown (render as key-value pairs)
3. Strengths (green tags)
4. Weaknesses (amber tags)
5. Matched skills (blue tags) / Missing skills (red tags)
6. Readiness summary
7. Priority improvements (numbered list)
8. Learning steps (numbered list)
9. Possible projects (card list)
10. Resume improvements (bulleted list)
11. Alternative roles (pill list)
12. Goal pathway (render as key-value pairs)

**Right panel:**
- Evidence items (collapsible list)
- "Regenerate analysis" button (stub — no-op for this phase, just shows a toast or alert)
- "Improve CV tips" — shows resume_improvements in a popover (or just links to the main section)

---

## Error Handling

- Missing `profile_id` in sessionStorage → redirect to `/`
- Missing `analysis_result` in sessionStorage → redirect to `/roles`
- Network error on any API call → show inline error message, do not redirect
- Backend 404 (profile not found, e.g. after server restart) → show "Session expired. Please upload your CV again." with a link to `/`

---

## Out of Scope (this phase)

- Switching roles from the dashboard sidebar (role re-analysis)
- Persisting analysis to a database
- Chat refinement
- 30/90/180-day roadmap generation
- RAG retrieval integration
