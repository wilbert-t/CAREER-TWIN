interface RightPanelProps {
  evidenceItems: string[];
  resumeImprovements: string[];
  onActionSelect?: (anchor: string) => void;
}

const ACTIONS = [
  { label: "Priority Improvements", anchor: "priority-improvements" },
  { label: "Possible Projects",     anchor: "possible-projects" },
  { label: "Goal Pathway",          anchor: "goal-pathway" },
];

export function RightPanel({ evidenceItems, resumeImprovements, onActionSelect }: RightPanelProps) {
  const displayEvidence = evidenceItems.map((item) =>
    item.replace(/^\[(?:CV|Project|Certificate)\]\s*/, "")
  );

  function tagColor(item: string): string {
    if (item.startsWith("[Project]")) return "bg-[#eaf0f4] text-[#3f5e78]";
    if (item.startsWith("[Certificate]")) return "bg-[#e9f1ea] text-[#5b7f63]";
    return "bg-[#f2ede4] text-[#6f675d]";
  }

  function tagLabel(item: string): string {
    if (item.startsWith("[Project]")) return "Project";
    if (item.startsWith("[Certificate]")) return "Cert";
    return "CV";
  }

  return (
    <aside className="bg-[var(--surface-muted)] p-4 lg:border-l lg:border-[var(--border-soft)]">
      <div className="space-y-5 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface)] p-4">
        <div>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8c847a]">
          Recommended Actions
          </p>
          <div className="space-y-2">
            {ACTIONS.map((action) => (
              <button
                key={action.anchor}
                onClick={() => onActionSelect?.(action.anchor)}
                className="group flex w-full items-center justify-between rounded-xl border border-[var(--border-soft)] bg-[#fcfbf8] px-3 py-2.5 text-left text-xs font-medium text-[#4b443d] transition-colors hover:border-[#cfd9e1] hover:bg-[#f8fbfc]"
              >
                <span>{action.label}</span>
                <span className="text-[#8c847a] transition-colors group-hover:text-[#3f5e78]">→</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8c847a]">
            Evidence From Your CV
          </p>
          {evidenceItems.length === 0 ? (
            <p className="text-xs italic text-[#8c847a]">No evidence found.</p>
          ) : (
            <ul className="space-y-2">
              {evidenceItems.map((raw, i) => (
                <li key={i} className="rounded-xl border border-[var(--border-soft)] bg-[#fcfbf8] px-3 py-2.5 text-xs leading-relaxed text-[#5f574e]">
                  <span
                    className={`mr-1.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${tagColor(raw)}`}
                  >
                    {tagLabel(raw)}
                  </span>
                  {displayEvidence[i]}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8c847a]">
            CV Tips
          </p>
          <ul className="space-y-2">
            {resumeImprovements.map((tip, i) => (
              <li
                key={i}
                className="rounded-xl border border-[#ebdcc2] bg-[#fbf5ea] px-3 py-2.5 text-xs leading-relaxed text-[#8c6a3e]"
              >
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
}
