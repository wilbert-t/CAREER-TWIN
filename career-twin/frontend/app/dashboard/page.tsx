"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LeftSidebar } from "@/components/dashboard/LeftSidebar";
import { MainContent } from "@/components/dashboard/MainContent";
import { RightPanel } from "@/components/dashboard/RightPanel";
import { ToolsRow } from "@/components/dashboard/ToolsRow";
import { analyzeRoleFit } from "@/lib/api";
import type { AnalyzeRoleFitResponse, RoleSuggestion } from "@/lib/types";

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

  useEffect(() => {
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
      setRoles(parsedRoles.map(r =>
        r.title === role ? { ...r, preview_match_score: actualScore } : r
      ));
    } else {
      setRoles(parsedRoles);
    }

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
        setRoles(prev => prev.map(r =>
          r.title === role.title ? { ...r, preview_match_score: actualScore } : r
        ));
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
      const actualScore = (result.match_score as { overall?: number }).overall;
      if (actualScore !== undefined) {
        setRoles(prev => prev.map(r =>
          r.title === role.title ? { ...r, preview_match_score: actualScore } : r
        ));
      }
    } catch (e) {
      setSwitchError(e instanceof Error ? e.message : "Role switch failed.");
    } finally {
      setIsSwitching(false);
    }
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
    setIsCompareLoading(true);
    try {
      const result = await analyzeRoleFit(profileId, role.title);
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

  if (!analysis) return null;

  // Roles available to compare (exclude current)
  const comparableRoles = roles.filter(r => r.title !== selectedRole);

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#F5F2ED" }}>
      {/* Left sidebar */}
      <div className="w-1/4 flex-shrink-0 overflow-y-auto border-r border-slate-100 bg-slate-50">
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
          onCompare={handleCompareToggle}
          isComparing={isComparing}
          isCompareLoading={isCompareLoading}
          canCompare={comparableRoles.length >= 1}
        />

        {/* Role picker (shown when picker is open) */}
        {comparePickerOpen && !isComparing && (
          <div className="border-b border-slate-100 bg-slate-50 px-6 py-3">
            <p className="mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Choose a role to compare with:
            </p>
            <div className="flex flex-wrap gap-2">
              {comparableRoles.map(role => (
                <button
                  key={role.id}
                  onClick={() => handleCompareSelect(role)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                >
                  {role.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Switch error banner */}
        {switchError && (
          <div className="mx-6 mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
            {switchError} —{" "}
            <button onClick={() => setSwitchError(null)} className="underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Switching overlay */}
        {isSwitching && (
          <div className="flex flex-1 items-center justify-center text-slate-400 text-sm">
            Analysing new role…
          </div>
        )}

        {/* Content: side-by-side when comparing, single otherwise */}
        {!isSwitching && (
          <div className="flex-1 overflow-y-auto">
            {isComparing && compareAnalysis ? (
              <div className="grid grid-cols-2 divide-x divide-slate-100 h-full">
                {/* Left: current role */}
                <div className="overflow-y-auto">
                  <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-6 py-2">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Current</p>
                    <p className="text-sm font-semibold text-slate-800 truncate">{selectedRole}</p>
                  </div>
                  <MainContent data={analysis} profileId={profileId} selectedRole={selectedRole} />
                </div>
                {/* Right: compared role */}
                <div className="overflow-y-auto">
                  <div className="sticky top-0 z-10 bg-blue-50 border-b border-blue-100 px-6 py-2">
                    <p className="text-xs font-semibold text-blue-400 uppercase tracking-wide">Comparing</p>
                    <p className="text-sm font-semibold text-blue-800 truncate">{compareRole}</p>
                  </div>
                  <MainContent data={compareAnalysis} profileId={profileId} selectedRole={compareRole} />
                </div>
              </div>
            ) : (
              <MainContent data={analysis} profileId={profileId} selectedRole={selectedRole} />
            )}
          </div>
        )}
      </div>

      {/* Right panel — hidden during compare, togglable */}
      {(!isComparing || rightPanelOpen) && (
        <div className="w-60 flex-shrink-0 overflow-y-auto bg-slate-50">
          <RightPanel
            evidenceItems={analysis.evidence_items}
            resumeImprovements={analysis.resume_improvements}
          />
        </div>
      )}

      {/* Floating toggle — only visible during compare */}
      {isComparing && (
        <button
          onClick={() => setRightPanelOpen(prev => !prev)}
          title={rightPanelOpen ? "Close panel" : "Open panel"}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center rounded-l-lg border border-r-0 border-slate-200 bg-white shadow px-2 py-4 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
        >
          <span className="text-base leading-none">{rightPanelOpen ? "›" : "‹"}</span>
        </button>
      )}
    </div>
  );
}
