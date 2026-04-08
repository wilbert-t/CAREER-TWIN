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
    <div className="flex flex-col items-center gap-1 rounded-lg border border-slate-200 bg-white px-4 py-2">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className={i < value ? "text-amber-400" : "text-slate-200"}>
            ★
          </span>
        ))}
      </div>
    </div>
  );
}

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded bg-slate-100 ${className ?? ""}`} />
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 leading-tight">{projectName}</h2>
            {detail && (
              <p className="mt-0.5 text-sm text-slate-500">{detail.short_description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {error ? (
            <div className="rounded-xl bg-red-50 px-4 py-4 text-center">
              <p className="text-sm text-red-700 mb-3">{error}</p>
              <button
                onClick={onRetry}
                className="rounded-lg border border-red-200 bg-white px-4 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : detail ? (
            <>
              {/* Badges */}
              <div className="flex gap-3">
                <StarRating value={detail.difficulty} label="Difficulty" />
                <StarRating value={detail.uniqueness} label="Uniqueness" />
                <div className="flex flex-col items-center gap-1 rounded-lg border border-slate-200 bg-white px-4 py-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Duration</span>
                  <span className="text-sm font-semibold text-slate-700">{detail.duration}</span>
                </div>
              </div>

              {/* Description */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Description</p>
                <p className="text-sm text-slate-700 leading-relaxed">{detail.description}</p>
              </div>

              {/* Objectives */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Objectives</p>
                <p className="text-sm text-slate-700 leading-relaxed">{detail.objectives}</p>
              </div>

              {/* Tools Required */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Tools Required</p>
                <div className="flex flex-wrap gap-2">
                  {detail.tools_required.map((tool, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700"
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
