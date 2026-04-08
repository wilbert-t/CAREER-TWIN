"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProfileForm } from "@/components/review/ProfileForm";
import { confirmProfile } from "@/lib/api";
import type { CVProfile, UploadResponse } from "@/lib/types";

export default function ReviewPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<CVProfile | null>(null);
  const [parseWarning, setParseWarning] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("upload_result");
    if (!raw) { router.push("/"); return; }
    const data: UploadResponse = JSON.parse(raw);
    setProfile(data.structured);
    if (data.parse_warning) setParseWarning(data.parse_warning);
  }, [router]);

  async function handleConfirm(updated: CVProfile) {
    setIsLoading(true);
    setError(null);
    try {
      const result = await confirmProfile(updated);
      sessionStorage.setItem("profile_id", result.profile_id);
      sessionStorage.setItem("confirmed_profile", JSON.stringify(updated));
      router.push("/roles");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile.");
      setIsLoading(false);
    }
  }

  if (!profile) return null;

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <p className="text-[11px] font-semibold tracking-widest text-slate-400 uppercase mb-1.5">
            Career Twin
          </p>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Review Your CV</h1>
          <p className="text-slate-500 mt-1.5">
            Check what we extracted. Edit anything before we build your career paths.
          </p>
        </div>

        {parseWarning && (
          <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <strong>Heads up:</strong> {parseWarning}
          </div>
        )}

        <ProfileForm
          initial={profile}
          onConfirm={handleConfirm}
          isLoading={isLoading}
        />

        {error && (
          <p className="mt-4 text-sm text-center text-red-500">{error}</p>
        )}
      </div>
    </main>
  );
}
