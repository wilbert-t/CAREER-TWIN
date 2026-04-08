import { useState } from "react";
import type { AnalyzeRoleFitResponse, PriorityImprovement, ProjectDetail } from "@/lib/types";
import { expandProject } from "@/lib/api";
import { SpeedometerArc, scoreToArcColor } from "./SpeedometerArc";
import { ProjectDetailModal } from "./ProjectDetailModal";

interface MainContentProps {
  data: AnalyzeRoleFitResponse;
  profileId: string;
  selectedRole: string;
}

function Section({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <div id={id} className="mb-8 scroll-mt-16">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</h2>
      {children}
    </div>
  );
}

function TagList({ items, color }: { items: string[]; color: "blue" | "green" | "red" | "amber" }) {
  const cls = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    red: "bg-red-50 text-red-700",
    amber: "bg-amber-50 text-amber-700",
  }[color];
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <span key={i} className={`rounded-full px-3 py-1 text-sm font-medium ${cls}`}>
          {item}
        </span>
      ))}
    </div>
  );
}

function NumberedList({ items }: { items: string[] }) {
  return (
    <ol className="list-decimal list-inside space-y-1">
      {items.map((item, i) => (
        <li key={i} className="text-sm text-slate-700 leading-relaxed">{item}</li>
      ))}
    </ol>
  );
}

function BreakdownBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 text-xs text-slate-500 capitalize">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value ?? 0}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-semibold text-slate-700 w-7 text-right">{value ?? "—"}</span>
    </div>
  );
}

const AREA_COLORS: Record<string, { bg: string; text: string }> = {
  Skills:     { bg: "bg-blue-50",   text: "text-blue-700" },
  Experience: { bg: "bg-violet-50", text: "text-violet-700" },
  Education:  { bg: "bg-emerald-50",text: "text-emerald-700" },
};

function ImprovementCard({ item }: { item: PriorityImprovement }) {
  const color = AREA_COLORS[item.area] ?? { bg: "bg-slate-50", text: "text-slate-600" };
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 space-y-2.5">
      <div className="flex items-start gap-3">
        <span className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${color.bg} ${color.text}`}>
          {item.area}
        </span>
        <p className="font-semibold text-slate-800 text-sm leading-snug">{item.title}</p>
      </div>
      <p className="text-sm text-slate-600 leading-relaxed">{item.detail}</p>
      <div className="flex gap-2 rounded-lg bg-slate-50 px-3 py-2">
        <span className="flex-shrink-0 text-xs font-semibold text-slate-400 uppercase tracking-wide mt-0.5">Action</span>
        <p className="text-sm text-slate-700 leading-relaxed">{item.action}</p>
      </div>
    </div>
  );
}

// Normalise priority_improvements — handles both old string[] format and new object[] format
function normaliseImprovements(raw: unknown[]): PriorityImprovement[] {
  return raw.map((item) => {
    if (typeof item === "string") {
      return { area: "Action", title: item, detail: "", action: "" };
    }
    return item as PriorityImprovement;
  });
}

export function MainContent({ data, profileId, selectedRole }: MainContentProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalProjectName, setModalProjectName] = useState("");
  const [modalDetail, setModalDetail] = useState<ProjectDetail | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  function loadProjectDetail(name: string, shortDesc: string) {
    expandProject(profileId, selectedRole, name, shortDesc)
      .then((result) => setModalDetail(result))
      .catch((err: Error) => setModalError(err.message ?? "Failed to load project details."));
  }

  function handleProjectClick(name: string, shortDesc: string) {
    setModalProjectName(name);
    setModalDetail(null);
    setModalError(null);
    setModalOpen(true);
    loadProjectDetail(name, shortDesc);
  }

  const role = data.selected_role as { title?: string; description?: string };
  const score = data.match_score as { overall?: number; label?: string };
  const breakdown = data.score_breakdown as { skills?: number; experience?: number; education?: number };
  const readiness = data.readiness_summary as { level?: string; summary?: string };
  const pathway = data.goal_pathway as { short_term?: string; mid_term?: string; long_term?: string };
  const improvements = normaliseImprovements(data.priority_improvements as unknown[]);

  return (
    <div className="p-6 pb-16">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">{role.title ?? "Role Analysis"}</h1>
        {role.description && (
          <p className="mt-1 text-sm text-slate-500">{role.description}</p>
        )}
      </div>

      {/* Match Score */}
      <Section title="Match Score">
        <div className="flex items-center gap-6 rounded-xl border border-slate-100 bg-slate-50 p-4">
          <SpeedometerArc score={score.overall ?? 0} size={96} showLabel labelText="Total" />
          <div className="flex-1 space-y-3">
            {(() => {
              const barColor = scoreToArcColor(score.overall ?? 0);
              return (
                <>
                  <BreakdownBar label="Skills"      value={breakdown.skills ?? 0}      color={barColor} />
                  <BreakdownBar label="Experience"  value={breakdown.experience ?? 0}  color={barColor} />
                  <BreakdownBar label="Education"   value={breakdown.education ?? 0}   color={barColor} />
                </>
              );
            })()}
          </div>
          <div className="flex-shrink-0 text-right">
            <p className="text-xs text-slate-400">{score.label ?? "Match"}</p>
          </div>
        </div>
      </Section>

      {/* Readiness */}
      <Section title="Readiness">
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <span className="inline-block rounded-full bg-blue-100 px-3 py-0.5 text-xs font-semibold text-blue-700 mb-2">
            {readiness.level ?? "—"}
          </span>
          <p className="text-sm text-slate-700 leading-relaxed">{readiness.summary ?? "—"}</p>
        </div>
      </Section>

      {/* Strengths / Weaknesses */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Strengths for this role</p>
          <TagList items={data.strengths} color="green" />
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Weaknesses for this role</p>
          <TagList items={data.weaknesses} color="amber" />
        </div>
      </div>

      {/* Matched / Missing Skills */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Matched Skills</p>
          <TagList items={data.matched_skills} color="blue" />
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Missing Skills</p>
          <TagList items={data.missing_skills} color="red" />
        </div>
      </div>

      {/* Priority Improvements */}
      <Section id="priority-improvements" title="Priority Improvements">
        <div className="space-y-3">
          {improvements.map((item, i) => (
            <ImprovementCard key={i} item={item} />
          ))}
        </div>
      </Section>

      {/* Learning Steps */}
      <Section title="Learning Steps">
        <NumberedList items={data.learning_steps} />
      </Section>

      {/* Possible Projects */}
      <Section id="possible-projects" title="Possible Projects">
        <div className="space-y-2">
          {data.possible_projects.map((project, i) => {
            const [name, ...rest] = project.split(":");
            const shortDesc = rest.join(":").trim();
            return (
              <button
                key={i}
                onClick={() => handleProjectClick(name.trim(), shortDesc)}
                className="w-full rounded-xl border border-slate-100 bg-white p-4 text-left hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-800 text-sm">{name.trim()}</p>
                  <span className="text-xs text-slate-400 group-hover:text-slate-600 transition-colors">View details →</span>
                </div>
                {shortDesc && (
                  <p className="text-sm text-slate-500 mt-1">{shortDesc}</p>
                )}
              </button>
            );
          })}
        </div>
      </Section>

      {/* Project Detail Modal */}
      {modalOpen && (
        <ProjectDetailModal
          projectName={modalProjectName}
          detail={modalDetail}
          error={modalError}
          onClose={() => { setModalOpen(false); setModalDetail(null); setModalError(null); }}
          onRetry={() => {
            setModalDetail(null);
            setModalError(null);
            const proj = data.possible_projects.find((p) => p.startsWith(modalProjectName));
            const shortDesc = proj ? proj.split(":").slice(1).join(":").trim() : "";
            loadProjectDetail(modalProjectName, shortDesc);
          }}
        />
      )}

      {/* Goal Pathway */}
      <Section id="goal-pathway" title="Goal Pathway">
        <div className="space-y-2">
          {(["short_term", "mid_term", "long_term"] as const).map((key) => (
            pathway[key] && (
              <div key={key} className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                <span className="flex-shrink-0 text-xs font-semibold uppercase text-slate-400 w-20 pt-0.5">
                  {key.replace("_", " ")}
                </span>
                <p className="text-sm text-slate-700">{pathway[key]}</p>
              </div>
            )
          ))}
        </div>
      </Section>
    </div>
  );
}
