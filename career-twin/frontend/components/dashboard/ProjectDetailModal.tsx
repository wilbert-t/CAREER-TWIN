"use client";

import { useEffect } from "react";
import type { ProjectDetail } from "@/lib/types";

interface ProjectDetailModalProps {
  projectName: string;
  detail: ProjectDetail | null;
  error: string | null;
  onClose: () => void;
  onRetry: () => void;
}

function StarRating({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl border border-[var(--border-soft)] bg-[var(--surface)] px-3 py-2 sm:px-4">
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8c847a]">{label}</span>
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className={i < value ? "text-[#b7864b]" : "text-[#ddd5c7]"}>
            ★
          </span>
        ))}
      </div>
    </div>
  );
}

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded bg-[#eee7db] ${className ?? ""}`} />
  );
}

export function ProjectDetailModal({
  projectName,
  detail,
  error,
  onClose,
  onRetry,
}: ProjectDetailModalProps) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(47,42,36,0.38)] p-4"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[24px] border border-[var(--border-soft)] bg-[#fcfaf6] shadow-[0_20px_50px_rgba(47,42,36,0.14)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[var(--border-soft)] bg-[#fcfaf6] px-4 py-4 sm:px-6">
          <div>
            <h2 className="text-lg font-bold leading-tight text-[#2f2a24]">{projectName}</h2>
            {detail && (
              <p className="mt-0.5 text-sm text-[#7a7268]">{detail.short_description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 rounded-lg p-1.5 text-[#8c847a] transition-colors hover:bg-[#f3eee4] hover:text-[#5f574e]"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6 px-4 py-5 sm:px-6">
          {error ? (
            <div className="rounded-xl border border-[#ead2cc] bg-[#f8eeeb] px-4 py-4 text-center">
              <p className="mb-3 text-sm text-[#a8655b]">{error}</p>
              <button
                onClick={onRetry}
                className="rounded-lg border border-[#ead2cc] bg-white px-4 py-1.5 text-sm font-medium text-[#a8655b] transition-colors hover:bg-[#f8eeeb]"
              >
                Retry
              </button>
            </div>
          ) : detail ? (
            <>
              {/* Badges */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <StarRating value={detail.difficulty} label="Difficulty" />
                <StarRating value={detail.uniqueness} label="Uniqueness" />
                <div className="flex flex-col items-center gap-1 rounded-xl border border-[var(--border-soft)] bg-[var(--surface)] px-4 py-2">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8c847a]">Duration</span>
                  <span className="text-sm font-semibold text-[#4b443d]">{detail.duration}</span>
                </div>
              </div>

              {/* Description */}
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8c847a]">Description</p>
                <p className="text-sm leading-relaxed text-[#5f574e]">{detail.description}</p>
              </div>

              {/* Objectives */}
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8c847a]">Objectives</p>
                <p className="text-sm leading-relaxed text-[#5f574e]">{detail.objectives}</p>
              </div>

              {/* Tools Required */}
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8c847a]">Tools Required</p>
                <div className="flex flex-wrap gap-2">
                  {detail.tools_required.map((tool, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-[#eaf0f4] px-3 py-1 text-sm font-medium text-[#3f5e78]"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* Loading skeleton */
            <>
              <div className="flex gap-3">
                <Skeleton className="h-16 w-24" />
                <Skeleton className="h-16 w-24" />
                <Skeleton className="h-16 w-24" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-28" />
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-7 w-16 rounded-full" />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
