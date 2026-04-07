"use client";

export type EvidenceFilter = "all" | "CV" | "Project" | "Certificate";

interface ToolsRowProps {
  evidenceFilter: EvidenceFilter;
  onEvidenceFilter: (f: EvidenceFilter) => void;
  onRegenerate: () => void;
  onCompare: () => void;
  isComparing: boolean;
  isCompareLoading: boolean;
  canCompare: boolean; // false when only 1 role available
  onScrollTo: (section: "resume" | "readiness") => void;
}

const FILTER_CHIPS: { label: string; value: EvidenceFilter }[] = [
  { label: "All", value: "all" },
  { label: "CV", value: "CV" },
  { label: "Projects", value: "Project" },
  { label: "Certificates", value: "Certificate" },
];

export function ToolsRow({
  evidenceFilter,
  onEvidenceFilter,
  onRegenerate,
  onCompare,
  isComparing,
  isCompareLoading,
  canCompare,
  onScrollTo,
}: ToolsRowProps) {
  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b border-slate-100 bg-white/95 px-6 py-3 backdrop-blur-sm">
      {/* Left: action buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onRegenerate}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          ↻ Regenerate
        </button>

        <button
          onClick={onCompare}
          disabled={!canCompare || isCompareLoading}
          className={[
            "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
            isComparing
              ? "border-blue-300 bg-blue-50 text-blue-700"
              : canCompare
              ? "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              : "border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed",
          ].join(" ")}
        >
          {isCompareLoading ? "Comparing…" : isComparing ? "Hide Compare" : "⇆ Compare"}
        </button>

        <button
          onClick={() => onScrollTo("resume")}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          ✏ Rewrite Bullets
        </button>

        <button
          onClick={() => onScrollTo("readiness")}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          ✦ Improve Summary
        </button>
      </div>

      {/* Right: evidence filter chips */}
      <div className="ml-auto flex items-center gap-1">
        <span className="mr-1 text-xs text-slate-400">Evidence:</span>
        {FILTER_CHIPS.map((chip) => (
          <button
            key={chip.value}
            onClick={() => onEvidenceFilter(chip.value)}
            className={[
              "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
              evidenceFilter === chip.value
                ? "bg-blue-500 text-white"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200",
            ].join(" ")}
          >
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  );
}
