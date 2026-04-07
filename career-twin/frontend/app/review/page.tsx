"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProfileForm } from "@/components/review/ProfileForm";
import { confirmProfile } from "@/lib/api";
import type { CVProfile, UploadResponse } from "@/lib/types";

export default function ReviewPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<CVProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("upload_result");
    if (!raw) { router.push("/"); return; }
    const data: UploadResponse = JSON.parse(raw);
    setProfile(data.structured);
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
    <main className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Review Your CV</h1>
          <p className="text-slate-500 mt-1">
            Check what we extracted. Edit anything before we build your career paths.
          </p>
        </div>

        <div className="rounded-2xl bg-white shadow-sm border border-slate-100 p-6">
          <ProfileForm
            initial={profile}
            onConfirm={handleConfirm}
            isLoading={isLoading}
          />
        </div>

        {error && (
          <p className="mt-4 text-sm text-center text-red-500">{error}</p>
        )}
      </div>
    </main>
  );
}
