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
