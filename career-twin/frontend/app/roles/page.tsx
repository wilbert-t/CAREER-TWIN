"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RoleCard } from "@/components/roles/RoleCard";
import { suggestRoles, analyzeRoleFit } from "@/lib/api";
import { Loader2 } from "lucide-react";
import type { RoleSuggestion, AnalyzeRoleFitResponse } from "@/lib/types";

const ANALYSIS_MESSAGES = [
  "Analyzing your profile…",
  "Mapping skill gaps…",
  "Building your roadmap…",
  "Almost there…",
];

const CACHE_KEY = (title: string) => `analysis_cache_${title}`;

export default function RolesPage() {
  const router = useRouter();
  const [roles, setRoles] = useState<RoleSuggestion[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [customRole, setCustomRole] = useState("");
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisMsg, setAnalysisMsg] = useState(ANALYSIS_MESSAGES[0]);
  const [error, setError] = useState<string | null>(null);
  // Track which role IDs are still being analysed in background
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const profileId = sessionStorage.getItem("profile_id");
    if (!profileId) { router.push("/"); return; }

    suggestRoles(profileId)
      .then((data) => {
        const allRoles = data.roles;
        setRoles(allRoles);
        sessionStorage.setItem("suggested_roles", JSON.stringify(allRoles));

        // Kick off full analysis for every role in parallel
        const pending = new Set(allRoles.map((r) => r.id));
        setLoadingIds(pending);

        allRoles.forEach((role) => {
          analyzeRoleFit(profileId, role.title)
            .then((result: AnalyzeRoleFitResponse) => {
              const actual = (result.match_score as { overall?: number }).overall;
              // Update score in the card
              setRoles((prev) => {
                const updated = prev.map((r) =>
                  r.id === role.id
                    ? { ...r, preview_match_score: actual ?? r.preview_match_score }
                    : r
                );
                sessionStorage.setItem("suggested_roles", JSON.stringify(updated));
                return updated;
              });
              // Cache the full result
              sessionStorage.setItem(CACHE_KEY(role.title), JSON.stringify(result));
            })
            .catch(() => { /* keep preview score on error */ })
            .finally(() => {
              setLoadingIds((prev) => {
                const next = new Set(prev);
                next.delete(role.id);
                return next;
              });
            });
        });
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

    // Use cached result if available (all suggested roles will be cached)
    const cached = sessionStorage.getItem(CACHE_KEY(activeRole));
    if (cached) {
      sessionStorage.setItem("selected_role", activeRole);
      sessionStorage.setItem("analysis_result", cached);
      router.push("/dashboard");
      return;
    }

    // Fallback: full analysis for custom role or cache miss
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

  /* Full-screen loading overlay during fallback analysis */
  if (analyzing) {
    return (
      <main className="fixed inset-0 flex flex-col items-center justify-center gap-6 z-50" style={{ backgroundColor: "#F5F2ED" }}>
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
        <p className="text-lg font-medium text-slate-700">{analysisMsg}</p>
      </main>
    );
  }

  const allAnalysed = loadingIds.size === 0 && roles.length > 0;

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="mx-auto max-w-xl space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-slate-900">Your Career Paths</h1>
          <p className="text-slate-500">
            Ranked by how well your background fits each role. Pick one to deep-dive.
          </p>
        </div>

        {loadingRoles ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
          </div>
        ) : (
          <>
            {/* Sort label + analysis status */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                ↑↓ Best match
              </span>
              {!allAnalysed && loadingIds.size > 0 && (
                <span className="flex items-center gap-1.5 text-xs text-indigo-400">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Scoring {loadingIds.size} role{loadingIds.size > 1 ? "s" : ""}…
                </span>
              )}
              {allAnalysed && (
                <span className="text-xs text-emerald-500 font-medium">✓ All scores ready</span>
              )}
            </div>

            {/* Role cards */}
            <div className="flex flex-col gap-3">
              {roles.map((role) => (
                <RoleCard
                  key={role.id}
                  role={role}
                  selected={selectedId === role.id}
                  loading={loadingIds.has(role.id)}
                  onSelect={handleCardSelect}
                />
              ))}
            </div>

            {/* Custom role input */}
            <div className="space-y-2 pt-2">
              <p className="text-sm font-medium text-slate-500">
                Or describe your own target role
              </p>
              <input
                type="text"
                value={customRole}
                onChange={(e) => handleCustomInput(e.target.value)}
                placeholder="e.g. Product Manager at a fintech startup"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <button
              onClick={handleAnalyze}
              disabled={!activeRole}
              className="w-full rounded-xl bg-indigo-600 py-3 text-white font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {activeRole && sessionStorage.getItem(CACHE_KEY(activeRole))
                ? "View analysis →"
                : "Analyze my fit →"}
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
