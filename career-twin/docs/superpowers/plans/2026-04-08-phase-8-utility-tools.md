# Phase 8 – Dashboard Utility Tools Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a sticky utility toolbar to the dashboard that lets users switch roles, compare scores, regenerate suggestions, filter evidence, and jump to key CV improvement sections.

**Architecture:** A new `ToolsRow` component sits above the main content area and owns the evidence filter state and compare toggle. Role switching state lives in `dashboard/page.tsx` — clicking a different role calls `analyzeRoleFit` again and replaces the analysis. `LeftSidebar` becomes clickable. `RightPanel` filters evidence items by the `[CV]`, `[Project]`, or `[Certificate]` tag prefix that was added to the prompt in Phase 7. No new backend endpoints are needed.

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind CSS v4, shadcn/ui, `lib/api.ts` (existing `analyzeRoleFit`)

---

## File Map

| File | Action |
|------|--------|
| `career-twin/frontend/components/dashboard/ToolsRow.tsx` | Create – sticky toolbar with 5 utility buttons + filter chips |
| `career-twin/frontend/components/dashboard/LeftSidebar.tsx` | Modify – add `onRoleSwitch` prop, make role items clickable |
| `career-twin/frontend/components/dashboard/RightPanel.tsx` | Modify – add `evidenceFilter` prop, filter evidence_items by prefix |
| `career-twin/frontend/app/dashboard/page.tsx` | Modify – role switch handler, compare handler, evidenceFilter state |

No backend changes in this phase (evidence tagging was done in Phase 7).

---

### Task 1: Make LeftSidebar roles clickable

**Files:**
- Modify: `career-twin/frontend/components/dashboard/LeftSidebar.tsx`

- [ ] **Step 1: Replace `LeftSidebar.tsx` with clickable version**

```tsx
// career-twin/frontend/components/dashboard/LeftSidebar.tsx
import type { RoleSuggestion } from "@/lib/types";

interface LeftSidebarProps {
  candidateName: string;
  roles: RoleSuggestion[];
  selectedRole: string;
  onRoleSwitch: (role: RoleSuggestion) => void;
  isSwitching: boolean;
}

export function LeftSidebar({
  candidateName,
  roles,
  selectedRole,
  onRoleSwitch,
  isSwitching,
}: LeftSidebarProps) {
  return (
    <aside className="flex flex-col gap-4 p-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Candidate</p>
        <p className="mt-1 font-semibold text-slate-800 truncate">{candidateName || "—"}</p>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
          Career Paths
        </p>
        <ul className="space-y-1">
          {roles.map((role) => {
            const isActive = role.title === selectedRole || role.id === selectedRole;
            return (
              <li key={role.id}>
                <button
                  onClick={() => !isActive && !isSwitching && onRoleSwitch(role)}
                  disabled={isActive || isSwitching}
                  className={[
                    "w-full text-left rounded-lg px-3 py-2 transition-colors",
                    isActive
                      ? "bg-blue-500 text-white"
                      : isSwitching
                      ? "text-slate-400 cursor-not-allowed"
                      : "text-slate-600 hover:bg-slate-100 cursor-pointer",
                  ].join(" ")}
                >
                  <p className="text-sm font-medium truncate">{role.title}</p>
                  <p
                    className={[
                      "text-xs",
                      isActive ? "text-blue-100" : "text-slate-400",
                    ].join(" ")}
                  >
                    {role.preview_match_score}% match
                  </p>
                </button>
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

- [ ] **Step 2: Run TypeScript type check**

```bash
cd career-twin/frontend && npx tsc --noEmit
```

Expected: error about missing `onRoleSwitch` and `isSwitching` props in `dashboard/page.tsx` — this is expected and will be fixed in Task 4. Note the errors; they should only be in `app/dashboard/page.tsx`.

- [ ] **Step 3: Commit**

```bash
git add career-twin/frontend/components/dashboard/LeftSidebar.tsx
git commit -m "feat: make LeftSidebar roles clickable with onRoleSwitch callback"
```

---

### Task 2: Create `ToolsRow` component

**Files:**
- Create: `career-twin/frontend/components/dashboard/ToolsRow.tsx`

- [ ] **Step 1: Create the component**

```tsx
// career-twin/frontend/components/dashboard/ToolsRow.tsx
"use client";

export type EvidenceFilter = "all" | "CV" | "Project" | "Certificate";

interface ToolsRowProps {
  evidenceFilter: EvidenceFilter;
  onEvidenceFilter: (f: EvidenceFilter) => void;
  onRegenerate: () => void;
  onCompare: () => void;
  isComparing: boolean;
  isCompareLoading: boolean;
  canCompare: boolean; // false when only 1 role available
  onScrollTo: (section: "resume" | "readiness") => void;
}

const FILTER_CHIPS: { label: string; value: EvidenceFilter }[] = [
  { label: "All", value: "all" },
  { label: "CV", value: "CV" },
  { label: "Projects", value: "Project" },
  { label: "Certificates", value: "Certificate" },
];

export function ToolsRow({
  evidenceFilter,
  onEvidenceFilter,
  onRegenerate,
  onCompare,
  isComparing,
  isCompareLoading,
  canCompare,
  onScrollTo,
}: ToolsRowProps) {
  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b border-slate-100 bg-white/95 px-6 py-3 backdrop-blur-sm">
      {/* Left: action buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onRegenerate}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          ↻ Regenerate
        </button>

        <button
          onClick={onCompare}
          disabled={!canCompare || isCompareLoading}
          className={[
            "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
            isComparing
              ? "border-blue-300 bg-blue-50 text-blue-700"
              : canCompare
              ? "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              : "border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed",
          ].join(" ")}
        >
          {isCompareLoading ? "Comparing…" : isComparing ? "Hide Compare" : "⇆ Compare"}
        </button>

        <button
          onClick={() => onScrollTo("resume")}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          ✏ Rewrite Bullets
        </button>

        <button
          onClick={() => onScrollTo("readiness")}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          ✦ Improve Summary
        </button>
      </div>

      {/* Right: evidence filter chips */}
      <div className="ml-auto flex items-center gap-1">
        <span className="mr-1 text-xs text-slate-400">Evidence:</span>
        {FILTER_CHIPS.map((chip) => (
          <button
            key={chip.value}
            onClick={() => onEvidenceFilter(chip.value)}
            className={[
              "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
              evidenceFilter === chip.value
                ? "bg-blue-500 text-white"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200",
            ].join(" ")}
          >
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Confirm the file exists**

```bash
ls career-twin/frontend/components/dashboard/
```

Expected: `LeftSidebar.tsx  MainContent.tsx  RightPanel.tsx  ToolsRow.tsx`

- [ ] **Step 3: Commit**

```bash
git add career-twin/frontend/components/dashboard/ToolsRow.tsx
git commit -m "feat: ToolsRow component with regenerate, compare, rewrite bullets, improve summary, evidence filter"
```

---

### Task 3: Add evidence filtering to RightPanel

**Files:**
- Modify: `career-twin/frontend/components/dashboard/RightPanel.tsx`

- [ ] **Step 1: Replace `RightPanel.tsx` with filtered version**

```tsx
// career-twin/frontend/components/dashboard/RightPanel.tsx
import type { EvidenceFilter } from "./ToolsRow";

interface RightPanelProps {
  evidenceItems: string[];
  resumeImprovements: string[];
  evidenceFilter: EvidenceFilter;
}

export function RightPanel({ evidenceItems, resumeImprovements, evidenceFilter }: RightPanelProps) {
  const filteredEvidence =
    evidenceFilter === "all"
      ? evidenceItems
      : evidenceItems.filter((item) => item.startsWith(`[${evidenceFilter}]`));

  // Strip the [TAG] prefix for display
  const displayEvidence = filteredEvidence.map((item) =>
    item.replace(/^\[(?:CV|Project|Certificate)\]\s*/, "")
  );

  // Tag badge colours
  function tagColor(item: string): string {
    if (item.startsWith("[Project]")) return "bg-purple-100 text-purple-700";
    if (item.startsWith("[Certificate]")) return "bg-green-100 text-green-700";
    return "bg-slate-100 text-slate-500"; // CV or untagged
  }

  function tagLabel(item: string): string {
    if (item.startsWith("[Project]")) return "Project";
    if (item.startsWith("[Certificate]")) return "Cert";
    return "CV";
  }

  return (
    <aside className="flex flex-col gap-6 p-4 border-l border-slate-100">
      {/* Evidence items */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Evidence from your CV
        </p>
        {displayEvidence.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No evidence for this filter.</p>
        ) : (
          <ul className="space-y-2">
            {filteredEvidence.map((raw, i) => (
              <li key={i} className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600 leading-relaxed">
                <span
                  className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold mr-1.5 ${tagColor(raw)}`}
                >
                  {tagLabel(raw)}
                </span>
                {displayEvidence[i]}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* CV tips */}
      <div id="resume-section">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          CV Tips
        </p>
        <ul className="space-y-2">
          {resumeImprovements.map((tip, i) => (
            <li
              key={i}
              className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 leading-relaxed"
            >
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Run TypeScript check (will still have dashboard/page.tsx errors)**

```bash
cd career-twin/frontend && npx tsc --noEmit 2>&1 | grep -v "page.tsx" | head -20
```

Expected: No errors outside of `page.tsx`.

- [ ] **Step 3: Commit**

```bash
git add career-twin/frontend/components/dashboard/RightPanel.tsx
git commit -m "feat: RightPanel evidence filter by [CV/Project/Certificate] tag with badge display"
```

---

### Task 4: Wire everything in `dashboard/page.tsx`

**Files:**
- Modify: `career-twin/frontend/app/dashboard/page.tsx`
- Modify: `career-twin/frontend/components/dashboard/MainContent.tsx` (add scroll-target IDs)

- [ ] **Step 1: Add section IDs to `MainContent.tsx` for scroll-to**

Open `career-twin/frontend/components/dashboard/MainContent.tsx` and add `id="readiness-section"` to the readiness summary section and confirm `resume-section` is on the RightPanel (already added in Task 3).

Find the readiness section in `MainContent.tsx` — it will be something like:

```tsx
<section className="...">
  <h2>Readiness</h2>
  ...
</section>
```

Change it to:

```tsx
<section id="readiness-section" className="...">
  <h2>Readiness</h2>
  ...
</section>
```

Read `career-twin/frontend/components/dashboard/MainContent.tsx` first to find the exact readiness section markup, then add the id.

- [ ] **Step 2: Replace `dashboard/page.tsx` entirely**

```tsx
// career-twin/frontend/app/dashboard/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LeftSidebar } from "@/components/dashboard/LeftSidebar";
import { MainContent } from "@/components/dashboard/MainContent";
import { RightPanel } from "@/components/dashboard/RightPanel";
import { ToolsRow, type EvidenceFilter } from "@/components/dashboard/ToolsRow";
import { analyzeRoleFit } from "@/lib/api";
import type { AnalyzeRoleFitResponse, RoleSuggestion } from "@/lib/types";

export default function DashboardPage() {
  const router = useRouter();
  const [analysis, setAnalysis] = useState<AnalyzeRoleFitResponse | null>(null);
  const [compareAnalysis, setCompareAnalysis] = useState<AnalyzeRoleFitResponse | null>(null);
  const [roles, setRoles] = useState<RoleSuggestion[]>([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [profileId, setProfileId] = useState("");
  const [candidateName, setCandidateName] = useState("");
  const [evidenceFilter, setEvidenceFilter] = useState<EvidenceFilter>("all");
  const [isSwitching, setIsSwitching] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [isCompareLoading, setIsCompareLoading] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("analysis_result");
    if (!raw) { router.push("/roles"); return; }
    setAnalysis(JSON.parse(raw));

    const rolesRaw = sessionStorage.getItem("suggested_roles");
    if (rolesRaw) setRoles(JSON.parse(rolesRaw));

    const role = sessionStorage.getItem("selected_role");
    if (role) setSelectedRole(role);

    const pid = sessionStorage.getItem("profile_id");
    if (pid) setProfileId(pid);

    const profileRaw = sessionStorage.getItem("confirmed_profile");
    if (profileRaw) {
      try { setCandidateName(JSON.parse(profileRaw).name ?? ""); } catch { /* ignore */ }
    }
  }, [router]);

  async function handleRoleSwitch(role: RoleSuggestion) {
    if (!profileId || isSwitching) return;
    setSwitchError(null);
    setIsSwitching(true);
    setIsComparing(false);
    setCompareAnalysis(null);
    try {
      const result = await analyzeRoleFit(profileId, role.title);
      setAnalysis(result);
      setSelectedRole(role.title);
      sessionStorage.setItem("analysis_result", JSON.stringify(result));
      sessionStorage.setItem("selected_role", role.title);
    } catch (e) {
      setSwitchError(e instanceof Error ? e.message : "Role switch failed.");
    } finally {
      setIsSwitching(false);
    }
  }

  async function handleCompare() {
    if (isComparing) {
      setIsComparing(false);
      setCompareAnalysis(null);
      return;
    }
    if (!profileId || roles.length < 2) return;
    const otherRole = roles.find(
      (r) => r.title !== selectedRole && r.id !== selectedRole
    );
    if (!otherRole) return;
    setIsCompareLoading(true);
    try {
      const result = await analyzeRoleFit(profileId, otherRole.title);
      setCompareAnalysis(result);
      setIsComparing(true);
    } catch {
      /* silently fail — compare is non-critical */
    } finally {
      setIsCompareLoading(false);
    }
  }

  function handleScrollTo(section: "resume" | "readiness") {
    const id = section === "resume" ? "resume-section" : "readiness-section";
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (!analysis) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* Left sidebar */}
      <div className="w-52 flex-shrink-0 overflow-y-auto border-r border-slate-100 bg-slate-50">
        <LeftSidebar
          candidateName={candidateName}
          roles={roles}
          selectedRole={selectedRole}
          onRoleSwitch={handleRoleSwitch}
          isSwitching={isSwitching}
        />
      </div>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <ToolsRow
          evidenceFilter={evidenceFilter}
          onEvidenceFilter={setEvidenceFilter}
          onRegenerate={() => router.push("/roles")}
          onCompare={handleCompare}
          isComparing={isComparing}
          isCompareLoading={isCompareLoading}
          canCompare={roles.length >= 2}
          onScrollTo={handleScrollTo}
        />

        {/* Switch error banner */}
        {switchError && (
          <div className="mx-6 mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
            {switchError} — <button onClick={() => setSwitchError(null)} className="underline">Dismiss</button>
          </div>
        )}

        {/* Switching overlay */}
        {isSwitching && (
          <div className="flex flex-1 items-center justify-center text-slate-400 text-sm">
            Analysing new role…
          </div>
        )}

        {/* Compare panel */}
        {isComparing && compareAnalysis && (
          <div className="mx-6 mt-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-500">
              Comparing with: {(compareAnalysis.selected_role as { title?: string }).title ?? "Other Role"}
            </p>
            <div className="flex gap-6 text-sm">
              <div>
                <span className="text-slate-500">Current:</span>{" "}
                <span className="font-bold text-slate-800">
                  {(analysis.match_score as { overall?: number }).overall ?? "—"}%
                </span>
              </div>
              <div>
                <span className="text-slate-500">Compared:</span>{" "}
                <span className="font-bold text-blue-700">
                  {(compareAnalysis.match_score as { overall?: number }).overall ?? "—"}%
                </span>
              </div>
              {(["skills", "experience", "education"] as const).map((key) => (
                <div key={key}>
                  <span className="text-slate-400 capitalize">{key}:</span>{" "}
                  <span className="text-slate-600">
                    {(analysis.score_breakdown as Record<string, number>)[key] ?? "—"} vs{" "}
                    {(compareAnalysis.score_breakdown as Record<string, number>)[key] ?? "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isSwitching && (
          <div className="flex-1 overflow-y-auto">
            <MainContent data={analysis} />
          </div>
        )}
      </div>

      {/* Right panel */}
      <div className="w-60 flex-shrink-0 overflow-y-auto bg-slate-50">
        <RightPanel
          evidenceItems={analysis.evidence_items}
          resumeImprovements={analysis.resume_improvements}
          evidenceFilter={evidenceFilter}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Run TypeScript type check — should be clean**

```bash
cd career-twin/frontend && npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add career-twin/frontend/app/dashboard/page.tsx career-twin/frontend/components/dashboard/MainContent.tsx
git commit -m "feat: role switching, compare panel, and scrollTo wired in dashboard page"
```

---

### Self-Review Checklist

1. **Spec coverage:**
   - ✅ Role switcher — LeftSidebar clickable + `handleRoleSwitch` in page.tsx
   - ✅ Compare-role toggle (V1 scores) — `handleCompare` + compare panel inline
   - ✅ Regenerate suggestions — navigates to `/roles`
   - ✅ Rewrite CV bullets — scrolls to `#resume-section` in RightPanel
   - ✅ Improve summary — scrolls to `#readiness-section` in MainContent
   - ✅ Evidence filter (CV/Project/Certificate) — ToolsRow chips + RightPanel filter
   - ✅ All lightweight — no new backend endpoints, no new sub-systems

2. **Placeholder scan:** None found. All code provided.

3. **Type consistency:** `EvidenceFilter` exported from `ToolsRow.tsx`, imported in `RightPanel.tsx` and `page.tsx`. `RoleSuggestion` from `@/lib/types` throughout. `AnalyzeRoleFitResponse` from `@/lib/types`.
