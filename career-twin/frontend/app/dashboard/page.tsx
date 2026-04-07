"use client";

import { useEffect, useState } from "react";
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

        {/* Compare panel */}
        {isComparing && compareAnalysis && (
          <div className="mx-6 mt-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-500">
              Comparing with:{" "}
              {(compareAnalysis.selected_role as { title?: string }).title ?? "Other Role"}
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
