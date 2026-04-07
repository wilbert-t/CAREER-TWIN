interface RightPanelProps {
  evidenceItems: string[];
  resumeImprovements: string[];
}

export function RightPanel({ evidenceItems, resumeImprovements }: RightPanelProps) {
  return (
    <aside className="flex flex-col gap-6 p-4 border-l border-slate-100">
      {/* Regenerate */}
      <div>
        <button
          onClick={() => alert("Regeneration coming in a future phase.")}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          ↻ Regenerate analysis
        </button>
      </div>

      {/* Evidence items */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Evidence from your CV
        </p>
        <ul className="space-y-2">
          {evidenceItems.map((item, i) => (
            <li key={i} className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600 leading-relaxed">
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* CV tips */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          CV Tips
        </p>
        <ul className="space-y-2">
          {resumeImprovements.map((tip, i) => (
            <li key={i} className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 leading-relaxed">
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
