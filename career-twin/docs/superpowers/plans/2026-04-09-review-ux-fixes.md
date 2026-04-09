# Review Page UX Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix three UX issues found by Codex adversarial review: unsaved-edit data loss on nav, misleading editable fields that don't feed the pipeline, and silent profile truncation with no user warning.

**Architecture:** All three fixes are frontend-only, isolated to two files. No backend changes, no new files. Task 1 adds dirty-state tracking + a confirm dialog to `ProfileForm.tsx`. Task 2 adds a read-only notice banner to the Projects and Awards sections in the same file. Task 3 changes `normaliseProfile()` in `review/page.tsx` to return a list of truncated fields, then surfaces that in the UI.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS

---

## File Map

| File | Action | What changes |
|------|--------|-------------|
| `career-twin/frontend/components/review/ProfileForm.tsx` | Modify | Task 1: `isDirty` state + confirm guard on `handleUploadClick`. Task 2: read-only banners on Projects and Awards sections |
| `career-twin/frontend/app/review/page.tsx` | Modify | Task 3: `normaliseProfile` returns truncated field list; render truncation warning |

---

### Task 1: Unsaved-changes guard on "Upload and Parse CV" nav button

Codex finding: `ProfileForm.tsx:71-72` — `handleUploadClick()` calls `router.push('/')` immediately, discarding any unsaved edits silently.

Fix: track a `isDirty` boolean; if dirty, show `window.confirm()` before navigating away.

**Files:**
- Modify: `career-twin/frontend/components/review/ProfileForm.tsx`

- [ ] **Step 1: Add `isDirty` state and mark dirty on every profile change**

Open `career-twin/frontend/components/review/ProfileForm.tsx`.

Find the existing state declarations inside `ProfileForm` (around line 30):
```tsx
  const [profile, setProfile] = useState<CVProfile>(initial);
  const [activeSection, setActiveSection] = useState<string>("personal");
  const [newSkill, setNewSkill] = useState("");
```

Replace with:
```tsx
  const [profile, setProfile] = useState<CVProfile>(initial);
  const [activeSection, setActiveSection] = useState<string>("personal");
  const [newSkill, setNewSkill] = useState("");
  const [isDirty, setIsDirty] = useState(false);
```

Then find the existing `set` helper (around line 50):
```tsx
  function set<K extends keyof CVProfile>(key: K, val: CVProfile[K]) {
    setProfile(p => ({ ...p, [key]: val }));
  }
```

Replace with:
```tsx
  function set<K extends keyof CVProfile>(key: K, val: CVProfile[K]) {
    setProfile(p => ({ ...p, [key]: val }));
    setIsDirty(true);
  }
```

- [ ] **Step 2: Add confirm dialog to `handleUploadClick`**

Find the existing `handleUploadClick` function (around line 71):
```tsx
  function handleUploadClick() {
    router.push("/");
  }
```

Replace with:
```tsx
  function handleUploadClick() {
    if (isDirty && !window.confirm("You have unsaved edits. Leave and discard them?")) return;
    router.push("/");
  }
```

- [ ] **Step 3: Verify manually**

```bash
cd /Users/wilbert/Documents/GitHub/CAREER-TWIN/career-twin/frontend
npm run dev
```

Open http://localhost:3000, upload any PDF, go to the review page. Edit any field (e.g. name). Click "Upload and Parse CV" in the sidebar. A browser confirm dialog must appear asking to discard edits. Click Cancel — should stay on review page. Click OK — should navigate to `/`.

Also verify: clicking "Upload and Parse CV" WITHOUT making any edits should navigate immediately with no dialog.

- [ ] **Step 4: Commit**

```bash
cd /Users/wilbert/Documents/GitHub/CAREER-TWIN
git add career-twin/frontend/components/review/ProfileForm.tsx
git commit -m "fix: confirm before navigating away from review form with unsaved edits"
```

---

### Task 2: Read-only notice on Projects and Awards sections

Codex finding: `ProfileForm.tsx:174-211` — Projects and Awards fields look editable but the backend builds prompts from `raw_text` only, so user edits are silently ignored by the analysis pipeline.

Fix: add a small amber info banner at the top of each of these two sections stating edits won't affect the analysis.

**Files:**
- Modify: `career-twin/frontend/components/review/ProfileForm.tsx`

- [ ] **Step 1: Add the notice banner to the Projects section**

Find the Projects section (around line 174):
```tsx
          <section id="projects" className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden scroll-mt-24">
            <SectionHeader label="Projects" />
            <div className="p-6">
              <EditableList
```

Replace with:
```tsx
          <section id="projects" className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden scroll-mt-24">
            <SectionHeader label="Projects" />
            <div className="px-6 pt-4">
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
                Shown for reference only — edits here don't affect your career analysis.
              </p>
            </div>
            <div className="p-6 pt-0">
              <EditableList
```

- [ ] **Step 2: Add the notice banner to the Awards & Certifications section**

Find the Awards section (around line 187):
```tsx
          <section id="awards" className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden scroll-mt-24">
            <SectionHeader label="Awards & Certifications" />
            <div className="space-y-6 p-6">
```

Replace with:
```tsx
          <section id="awards" className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden scroll-mt-24">
            <SectionHeader label="Awards & Certifications" />
            <div className="px-6 pt-4">
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
                Shown for reference only — edits here don't affect your career analysis.
              </p>
            </div>
            <div className="space-y-6 px-6 pb-6">
```

- [ ] **Step 3: Verify manually**

With the dev server running, go to the review page. Scroll to the Projects section and the Awards & Certifications section. Both must show the amber notice banner below their section header. Verify the banner reads: "Shown for reference only — edits here don't affect your career analysis."

- [ ] **Step 4: Commit**

```bash
cd /Users/wilbert/Documents/GitHub/CAREER-TWIN
git add career-twin/frontend/components/review/ProfileForm.tsx
git commit -m "fix: add read-only notice to projects and awards sections"
```

---

### Task 3: Surface truncated sections from normaliseProfile as a warning

Codex finding: `review/page.tsx:10-19` — `normaliseProfile()` silently replaces non-array sections with `[]`. Users confirm an already-truncated profile with no indication which sections were affected.

Fix: change `normaliseProfile` to return which sections it zeroed out, and show them in the existing warning banner area.

**Files:**
- Modify: `career-twin/frontend/app/review/page.tsx`

- [ ] **Step 1: Update `normaliseProfile` to return truncated field names**

Find the existing `normaliseProfile` function (lines 10–21):
```tsx
function normaliseProfile(profile: CVProfile): CVProfile {
  return {
    ...profile,
    experience: Array.isArray(profile.experience) ? profile.experience : [],
    education: Array.isArray(profile.education) ? profile.education : [],
    skills: Array.isArray(profile.skills) ? profile.skills : [],
    projects: Array.isArray(profile.projects) ? profile.projects : [],
    awards: Array.isArray(profile.awards) ? profile.awards : [],
    certificates: Array.isArray(profile.certificates) ? profile.certificates : [],
    leadership: Array.isArray(profile.leadership) ? profile.leadership : [],
  };
}
```

Replace with:
```tsx
function normaliseProfile(profile: CVProfile): { profile: CVProfile; truncated: string[] } {
  const truncated: string[] = [];
  const fields = ["experience", "education", "skills", "projects", "awards", "certificates", "leadership"] as const;
  const result = { ...profile };
  for (const field of fields) {
    if (!Array.isArray(profile[field])) {
      (result as Record<string, unknown>)[field] = [];
      truncated.push(field);
    }
  }
  return { profile: result, truncated };
}
```

- [ ] **Step 2: Update `readUploadResult` to thread through the truncated list**

Find the existing `readUploadResult` function (lines 23–42):
```tsx
function readUploadResult(): { profile: CVProfile | null; parseWarning: string | null } {
  if (typeof window === "undefined") {
    return { profile: null, parseWarning: null };
  }

  const raw = sessionStorage.getItem("upload_result");
  if (!raw) {
    return { profile: null, parseWarning: null };
  }

  try {
    const data: UploadResponse = JSON.parse(raw);
    return {
      profile: data.structured ? normaliseProfile(data.structured) : null,
      parseWarning: data.parse_warning ?? null,
    };
  } catch {
    return { profile: null, parseWarning: null };
  }
}
```

Replace with:
```tsx
function readUploadResult(): { profile: CVProfile | null; parseWarning: string | null; truncatedSections: string[] } {
  if (typeof window === "undefined") {
    return { profile: null, parseWarning: null, truncatedSections: [] };
  }

  const raw = sessionStorage.getItem("upload_result");
  if (!raw) {
    return { profile: null, parseWarning: null, truncatedSections: [] };
  }

  try {
    const data: UploadResponse = JSON.parse(raw);
    if (!data.structured) {
      return { profile: null, parseWarning: data.parse_warning ?? null, truncatedSections: [] };
    }
    const { profile, truncated } = normaliseProfile(data.structured);
    return {
      profile,
      parseWarning: data.parse_warning ?? null,
      truncatedSections: truncated,
    };
  } catch {
    return { profile: null, parseWarning: null, truncatedSections: [] };
  }
}
```

- [ ] **Step 3: Use `truncatedSections` in the component**

Find the existing state declaration in `ReviewPage` (around line 46):
```tsx
  const [{ profile, parseWarning }] = useState(readUploadResult);
```

Replace with:
```tsx
  const [{ profile, parseWarning, truncatedSections }] = useState(readUploadResult);
```

Then find the existing `parseWarning` banner (around line 137):
```tsx
        {parseWarning && (
          <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <strong>Heads up:</strong> {parseWarning}
          </div>
        )}
```

Replace with:
```tsx
        {parseWarning && (
          <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <strong>Heads up:</strong> {parseWarning}
          </div>
        )}

        {truncatedSections.length > 0 && (
          <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <strong>Some sections couldn't be parsed:</strong>{" "}
            {truncatedSections.join(", ")} — these appear empty below. You can add them manually before confirming.
          </div>
        )}
```

- [ ] **Step 4: Verify manually**

With the dev server running, upload a valid PDF and go to the review page. In normal operation, no truncation warning should appear. To test the warning: temporarily change one line in `normaliseProfile` to force a truncation (e.g. set `result.projects = []` and push `"projects"` to `truncated`), reload the page after re-uploading, and confirm the amber banner appears listing "projects". Revert the test change afterward.

- [ ] **Step 5: Commit**

```bash
cd /Users/wilbert/Documents/GitHub/CAREER-TWIN
git add career-twin/frontend/app/review/page.tsx
git commit -m "fix: warn user when normaliseProfile silently zeros out malformed sections"
```

---

## Self-Review

**Spec coverage:**
- ✅ [HIGH] Unsaved-changes guard — Task 1
- ✅ [HIGH] Read-only notice on misleading editable sections — Task 2
- ✅ [MEDIUM] Truncation warning from normaliseProfile — Task 3

**Placeholder scan:** None. All steps show exact code diffs.

**Type consistency:**
- `normaliseProfile` return type changes from `CVProfile` to `{ profile: CVProfile; truncated: string[] }` — used consistently in Task 3 steps 1 and 2.
- `readUploadResult` return type gains `truncatedSections: string[]` — destructured in Task 3 step 3.
- No cross-task type references; each task is self-contained.
