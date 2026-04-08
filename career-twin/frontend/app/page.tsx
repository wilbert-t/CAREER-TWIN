"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
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

      {/* Upload page */}
      <main className="relative min-h-screen flex flex-col items-center justify-center px-4 py-16 overflow-hidden">

        {/* Decorative arc — matches loading screen */}
        <svg
          className="fixed inset-0 w-full h-full pointer-events-none"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          style={{ zIndex: 0 }}
        >
          <circle
            cx="72%" cy="50%" r="42%"
            fill="none"
            stroke="#D9D4CC"
            strokeWidth="1"
            opacity="0.7"
          />
        </svg>

        {/* Orbiting dot — matches loading screen */}
        <motion.div
          className="fixed pointer-events-none"
          style={{ left: "72%", top: "50%", width: 0, height: 0, zIndex: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        >
          <div
            className="absolute w-10 h-10 rounded-full"
            style={{
              backgroundColor: "#C4A882",
              boxShadow: "0 0 20px rgba(196,168,130,1), 0 0 40px rgba(196,168,130,0.6), 0 0 80px rgba(196,168,130,0.25)",
              transform: "translate(-50%, calc(-45vmin - 50%))",
            }}
          />
        </motion.div>

        {/* Content */}
        <div className="relative w-full max-w-lg space-y-8" style={{ zIndex: 1 }}>
          <div className="text-center space-y-3">
            <motion.h1
              className="text-4xl font-bold tracking-tight"
              style={{
                backgroundImage: "linear-gradient(90deg, #1C2B3A 20%, #8A7060 38%, #C4A882 45%, #EDD9B8 50%, #C4A882 55%, #8A7060 62%, #1C2B3A 80%)",
                backgroundSize: "200% 100%",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
              initial={{ backgroundPosition: "200% center" }}
              animate={{ backgroundPosition: "0% center" }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
            >
              Career Twin
            </motion.h1>
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
