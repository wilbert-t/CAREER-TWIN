"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LeftSidebar } from "@/components/dashboard/LeftSidebar";
import { MainContent } from "@/components/dashboard/MainContent";
import { RightPanel } from "@/components/dashboard/RightPanel";
import { ToolsRow } from "@/components/dashboard/ToolsRow";
import { analyzeRoleFit, analyzeRoleFitWithRetry } from "@/lib/api";
import type { AnalyzeRoleFitResponse, RoleSuggestion } from "@/lib/types";

const CACHE_KEY = (title: string) => `analysis_cache_${title}`;

export default function DashboardPage() {
  const router = useRouter();
  const [analysis, setAnalysis] = useState<AnalyzeRoleFitResponse | null>(null);
  const [compareAnalysis, setCompareAnalysis] = useState<AnalyzeRoleFitResponse | null>(null);
  const [compareRole, setCompareRole] = useState<string>("");
  const [roles, setRoles] = useState<RoleSuggestion[]>([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [profileId, setProfileId] = useState("");
  const [candidateName, setCandidateName] = useState("");
  const [isSwitching, setIsSwitching] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [isCompareLoading, setIsCompareLoading] = useState(false);
  const [comparePickerOpen, setComparePickerOpen] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [highlightedSectionId, setHighlightedSectionId] = useState<string | null>(null);
  const [highlightSequence, setHighlightSequence] = useState(0);
  const highlightTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const raw = sessionStorage.getItem("analysis_result");
    if (!raw) { router.push("/roles"); return; }
    const parsedAnalysis: AnalyzeRoleFitResponse = JSON.parse(raw);
    setAnalysis(parsedAnalysis);

    const rolesRaw = sessionStorage.getItem("suggested_roles");
    const parsedRoles: RoleSuggestion[] = rolesRaw ? JSON.parse(rolesRaw) : [];

    const role = sessionStorage.getItem("selected_role") ?? "";
    if (role) setSelectedRole(role);

    // Sync preview_match_score with the actual analysis score for the selected role
    const actualScore = (parsedAnalysis.match_score as { overall?: number }).overall;
    if (actualScore !== undefined && role && parsedRoles.length > 0) {
      const updatedRoles = parsedRoles.map(r =>
        r.title === role ? { ...r, preview_match_score: actualScore } : r
      );
      setRoles(updatedRoles);
      sessionStorage.setItem("suggested_roles", JSON.stringify(updatedRoles));
    } else {
      setRoles(parsedRoles);
    }

    const pid = sessionStorage.getItem("profile_id");
    if (pid) setProfileId(pid);

    const profileRaw = sessionStorage.getItem("confirmed_profile");
    if (profileRaw) {
      try { setCandidateName(JSON.parse(profileRaw).name ?? ""); } catch { /* ignore */ }
    }

    if (pid && parsedRoles.length > 0) {
      void (async () => {
        for (const currentRole of parsedRoles) {
          const currentScore = currentRole.title === role
            ? actualScore
            : currentRole.preview_match_score;

          if ((currentScore ?? 0) > 0) {
            continue;
          }

          try {
            const result = await analyzeRoleFitWithRetry(pid, currentRole.title, 4);
            if (cancelled) return;

            const nextScore = (result.match_score as { overall?: number }).overall;
            if (nextScore === undefined) {
              continue;
            }

            if (currentRole.title === role) {
              setAnalysis(result);
              sessionStorage.setItem("analysis_result", JSON.stringify(result));
            }

            sessionStorage.setItem(CACHE_KEY(currentRole.title), JSON.stringify(result));
            setRoles((prev) => {
              const updated = prev.map((item) =>
                item.title === currentRole.title
                  ? { ...item, preview_match_score: nextScore }
                  : item
              );
              sessionStorage.setItem("suggested_roles", JSON.stringify(updated));
              return updated;
            });
          } catch {
            if (cancelled) return;
          }
        }
      })();
    }

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleRoleSwitch(role: RoleSuggestion) {
    if (!profileId || isSwitching) return;
    setSwitchError(null);
    setIsComparing(false);
    setCompareAnalysis(null);
    setComparePickerOpen(false);

    // Use cached full analysis if available (pre-computed on roles page)
    const cached = sessionStorage.getItem(`analysis_cache_${role.title}`);
    if (cached) {
      const result = JSON.parse(cached) as AnalyzeRoleFitResponse;
      setAnalysis(result);
      setSelectedRole(role.title);
      sessionStorage.setItem("analysis_result", cached);
      sessionStorage.setItem("selected_role", role.title);
      const actualScore = (result.match_score as { overall?: number }).overall;
      if (actualScore !== undefined) {
        setRoles(prev => {
          const updated = prev.map(r =>
            r.title === role.title ? { ...r, preview_match_score: actualScore } : r
          );
          sessionStorage.setItem("suggested_roles", JSON.stringify(updated));
          return updated;
        });
      }
      return;
    }

    // Fallback: live API call (custom roles or cache miss)
    setIsSwitching(true);
    try {
      const result = await analyzeRoleFit(profileId, role.title);
      setAnalysis(result);
      setSelectedRole(role.title);
      sessionStorage.setItem("analysis_result", JSON.stringify(result));
      sessionStorage.setItem("selected_role", role.title);
      sessionStorage.setItem(CACHE_KEY(role.title), JSON.stringify(result));
      const actualScore = (result.match_score as { overall?: number }).overall;
      if (actualScore !== undefined) {
        setRoles(prev => {
          const updated = prev.map(r =>
            r.title === role.title ? { ...r, preview_match_score: actualScore } : r
          );
          sessionStorage.setItem("suggested_roles", JSON.stringify(updated));
          return updated;
        });
      }
    } catch (e) {
      setSwitchError(e instanceof Error ? e.message : "Role switch failed.");
    } finally {
      setIsSwitching(false);
    }
  }

  function handleRecommendedAction(anchor: string) {
    if (highlightTimeoutRef.current) {
      window.clearTimeout(highlightTimeoutRef.current);
    }

    setHighlightedSectionId(anchor);
    setHighlightSequence((current) => current + 1);
    highlightTimeoutRef.current = window.setTimeout(() => {
      setHighlightedSectionId((current) => (current === anchor ? null : current));
      highlightTimeoutRef.current = null;
    }, 1800);
  }

  // Toggle compare: if already comparing, hide; otherwise open picker
  function handleCompareToggle() {
    if (isComparing) {
      setIsComparing(false);
      setCompareAnalysis(null);
      setCompareRole("");
      setComparePickerOpen(false);
      setRightPanelOpen(true);
    } else {
      setComparePickerOpen(prev => !prev);
    }
  }

  async function handleCompareSelect(role: RoleSuggestion) {
    if (!profileId) return;
    setComparePickerOpen(false);

    // Use pre-computed cache so compare score matches what the role card shows
    const cached = sessionStorage.getItem(CACHE_KEY(role.title));
    if (cached) {
      setCompareAnalysis(JSON.parse(cached) as AnalyzeRoleFitResponse);
      setCompareRole(role.title);
      setIsComparing(true);
      setRightPanelOpen(false);
      return;
    }

    setIsCompareLoading(true);
    try {
      const result = await analyzeRoleFit(profileId, role.title);
      sessionStorage.setItem(CACHE_KEY(role.title), JSON.stringify(result));
      setCompareAnalysis(result);
      setCompareRole(role.title);
      setIsComparing(true);
      setRightPanelOpen(false);
    } catch {
      /* silently fail — compare is non-critical */
    } finally {
      setIsCompareLoading(false);
    }
  }

  if (!analysis) return (
    <div className="fixed inset-0 flex items-center justify-center bg-[var(--background)]">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#c4a882] border-t-transparent" />
    </div>
  );

  // Roles available to compare (exclude current)
  const comparableRoles = roles.filter(r => r.title !== selectedRole);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)] lg:h-screen lg:flex-row lg:overflow-hidden">
      {/* Left sidebar */}
      <div className="border-b border-[var(--border-soft)] bg-[var(--surface-muted)] lg:w-[290px] lg:flex-shrink-0 lg:overflow-y-auto lg:border-b-0 lg:border-r">
        <LeftSidebar
          candidateName={candidateName}
          roles={roles}
          selectedRole={selectedRole}
          onRoleSwitch={handleRoleSwitch}
          isSwitching={isSwitching}
        />
      </div>

      {/* Main area */}
      <div className="flex min-h-0 flex-1 flex-col lg:overflow-hidden">
        <ToolsRow
          onCompare={handleCompareToggle}
          isComparing={isComparing}
          isCompareLoading={isCompareLoading}
          canCompare={comparableRoles.length >= 1}
        />

        {/* Role picker (shown when picker is open) */}
        {comparePickerOpen && !isComparing && (
          <div className="border-b border-[var(--border-soft)] bg-[var(--surface-muted)] px-4 py-3 sm:px-6">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8c847a]">
              Choose a role to compare with:
            </p>
            <div className="flex flex-wrap gap-2">
              {comparableRoles.map(role => (
                <button
                  key={role.id}
                  onClick={() => handleCompareSelect(role)}
                  className="rounded-lg border border-[var(--border-soft)] bg-white px-3 py-1.5 text-xs font-medium text-[#5f574e] transition-colors hover:border-[#cfd9e1] hover:bg-[#f8fbfc] hover:text-[#3f5e78]"
                >
                  {role.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Switch error banner */}
        {switchError && (
          <div className="mx-4 mt-3 rounded-lg border border-[#ead2cc] bg-[#f8eeeb] px-4 py-2 text-sm text-[#a8655b] sm:mx-6">
            {switchError} —{" "}
            <button onClick={() => setSwitchError(null)} className="underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Switching overlay */}
        {isSwitching && (
          <div className="flex flex-1 items-center justify-center text-sm text-[#8c847a]">
            Analysing new role…
          </div>
        )}

        {/* Content: side-by-side when comparing, single otherwise */}
        {!isSwitching && (
          <div className="flex-1 lg:overflow-y-auto">
            {isComparing && compareAnalysis ? (
              <div className="grid h-full grid-cols-1 divide-y divide-[var(--border-soft)] xl:grid-cols-2 xl:divide-x xl:divide-y-0">
                {/* Left: current role */}
                <div className="xl:overflow-y-auto">
                  <div className="sticky top-0 z-10 border-b border-[var(--border-soft)] bg-[var(--surface)] px-4 py-2 sm:px-6">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8c847a]">Current</p>
                    <p className="truncate text-sm font-semibold text-[#2f2a24]">{selectedRole}</p>
                  </div>
                  <MainContent
                    data={analysis}
                    profileId={profileId}
                    selectedRole={selectedRole}
                    highlightedSectionId={highlightedSectionId}
                    highlightSequence={highlightSequence}
                  />
                </div>
                {/* Right: compared role */}
                <div className="xl:overflow-y-auto">
                  <div className="sticky top-0 z-10 border-b border-[#d9e3ea] bg-[#eef3f6] px-4 py-2 sm:px-6">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#708697]">Comparing</p>
                    <p className="truncate text-sm font-semibold text-[#2f4b61]">{compareRole}</p>
                  </div>
                  <MainContent
                    data={compareAnalysis}
                    profileId={profileId}
                    selectedRole={compareRole}
                  />
                </div>
              </div>
            ) : (
              <MainContent
                data={analysis}
                profileId={profileId}
                selectedRole={selectedRole}
                highlightedSectionId={highlightedSectionId}
                highlightSequence={highlightSequence}
              />
            )}
          </div>
        )}
      </div>

      {/* Right panel — hidden during compare, togglable */}
      {(!isComparing || rightPanelOpen) && (
        <div className="border-t border-[var(--border-soft)] bg-[var(--surface-muted)] lg:w-64 lg:flex-shrink-0 lg:overflow-y-auto lg:border-t-0">
          <RightPanel
            evidenceItems={analysis.evidence_items}
            resumeImprovements={analysis.resume_improvements}
            onActionSelect={handleRecommendedAction}
          />
        </div>
      )}

      {/* Floating toggle — only visible during compare */}
      {isComparing && (
        <button
          onClick={() => setRightPanelOpen(prev => !prev)}
          title={rightPanelOpen ? "Close panel" : "Open panel"}
          className="fixed right-0 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-l-lg border border-r-0 border-[var(--border-soft)] bg-[var(--surface)] px-2 py-4 text-[#7a7268] shadow transition-colors hover:bg-[#f8fbfc] hover:text-[#3f5e78] lg:flex"
        >
          <span className="text-base leading-none">{rightPanelOpen ? "›" : "‹"}</span>
        </button>
      )}
    </div>
  );
}
