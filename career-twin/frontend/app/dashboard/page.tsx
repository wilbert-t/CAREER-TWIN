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
