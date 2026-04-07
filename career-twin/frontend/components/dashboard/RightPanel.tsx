import type { EvidenceFilter } from "./ToolsRow";

interface RightPanelProps {
  evidenceItems: string[];
  resumeImprovements: string[];
  evidenceFilter: EvidenceFilter;
}

export function RightPanel({ evidenceItems, resumeImprovements, evidenceFilter }: RightPanelProps) {
  const filteredEvidence =
    evidenceFilter === "all"
      ? evidenceItems
      : evidenceItems.filter((item) => item.startsWith(`[${evidenceFilter}]`));

  // Strip the [TAG] prefix for display
  const displayEvidence = filteredEvidence.map((item) =>
    item.replace(/^\[(?:CV|Project|Certificate)\]\s*/, "")
  );

  function tagColor(item: string): string {
    if (item.startsWith("[Project]")) return "bg-purple-100 text-purple-700";
    if (item.startsWith("[Certificate]")) return "bg-green-100 text-green-700";
    return "bg-slate-100 text-slate-500"; // CV or untagged
  }

  function tagLabel(item: string): string {
    if (item.startsWith("[Project]")) return "Project";
    if (item.startsWith("[Certificate]")) return "Cert";
    return "CV";
  }

  return (
    <aside className="flex flex-col gap-6 p-4 border-l border-slate-100">
      {/* Evidence items */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Evidence from your CV
        </p>
        {displayEvidence.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No evidence for this filter.</p>
        ) : (
          <ul className="space-y-2">
            {filteredEvidence.map((raw, i) => (
              <li key={i} className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600 leading-relaxed">
                <span
                  className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold mr-1.5 ${tagColor(raw)}`}
                >
                  {tagLabel(raw)}
                </span>
                {displayEvidence[i]}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* CV tips */}
      <div id="resume-section">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          CV Tips
        </p>
        <ul className="space-y-2">
          {resumeImprovements.map((tip, i) => (
            <li
              key={i}
              className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 leading-relaxed"
            >
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
