"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UploadZone } from "@/components/upload/UploadZone";
import { uploadCV } from "@/lib/api";
import { CareerTwinIntro } from "@/components/intro/CareerTwinIntro";
import type { UploadResponse } from "@/lib/types";

const LOADING_MESSAGES = [
  "Reading your CV…",
  "Identifying your experience…",
  "Structuring your profile…",
];

export default function UploadPage() {
  const router = useRouter();
  const [showIntro, setShowIntro] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);
  const [error, setError] = useState<string | null>(null);

  // Lock body scroll while intro is active
  useEffect(() => {
    if (showIntro) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [showIntro]);

  async function handleUpload(file: File) {
    setIsLoading(true);
    setError(null);

    let msgIdx = 0;
    const interval = setInterval(() => {
      msgIdx = (msgIdx + 1) % LOADING_MESSAGES.length;
      setLoadingMsg(LOADING_MESSAGES[msgIdx]);
    }, 1800);

    try {
      const result: UploadResponse = await uploadCV(file);
      clearInterval(interval);
      sessionStorage.setItem("upload_result", JSON.stringify(result));
      router.push("/review");
    } catch (err) {
      clearInterval(interval);
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <>
      {/* Intro transition — sits above the upload page (z-40) */}
      {showIntro && (
        <CareerTwinIntro onComplete={() => setShowIntro(false)} />
      )}

      {/* Existing upload page — unchanged, renders beneath the intro */}
      <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="w-full max-w-lg space-y-8">
          <div className="text-center space-y-3">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">
              Career Twin
            </h1>
            <p className="text-lg text-slate-500">
              Upload your CV and discover your ideal career path.
            </p>
          </div>

          <UploadZone
            onUpload={handleUpload}
            isLoading={isLoading}
            loadingMessage={loadingMsg}
          />

          {error && (
            <p className="text-sm text-center text-red-500">{error}</p>
          )}

          <p className="text-xs text-center text-slate-400">
            Your CV is processed securely and never stored permanently.
          </p>
        </div>
      </main>
    </>
  );
}
