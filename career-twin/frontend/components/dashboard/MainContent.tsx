import { useState } from "react";
import type { AnalyzeRoleFitResponse, PriorityImprovement, ProjectDetail } from "@/lib/types";
import { expandProject } from "@/lib/api";
import { SpeedometerArc, scoreToArcColor } from "./SpeedometerArc";
import { ProjectDetailModal } from "./ProjectDetailModal";

interface MainContentProps {
  data: AnalyzeRoleFitResponse;
  profileId: string;
  selectedRole: string;
  highlightedSectionId?: string | null;
  highlightSequence?: number;
}

function Section({
  id,
  title,
  children,
  isHighlighted = false,
  highlightKey = 0,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
  isHighlighted?: boolean;
  highlightKey?: number;
}) {
  return (
    <div
      key={id ? `${id}-${highlightKey}` : undefined}
      id={id}
      data-dashboard-section={id}
      className={[
        "mb-10 scroll-mt-24 rounded-[28px] px-3 py-3 transition-all duration-500 sm:px-4",
        isHighlighted
          ? "dashboard-section-highlight bg-[#f8f2e8] shadow-[0_0_0_1px_rgba(203,177,133,0.55),0_20px_40px_rgba(120,90,40,0.08)]"
          : "bg-transparent shadow-none",
      ].join(" ")}
    >
      <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-[#5f574e] sm:text-[15px]">{title}</h2>
      {children}
    </div>
  );
}

function TagList({ items, color }: { items: string[]; color: "blue" | "green" | "red" | "amber" }) {
  const cls = {
    blue: "bg-[#eaf0f4] text-[#3f5e78]",
    green: "bg-[#e9f1ea] text-[#5b7f63]",
    red: "bg-[#f4e5e0] text-[#a8655b]",
    amber: "bg-[#f5ead8] text-[#b7864b]",
  }[color];
  return (
    <div className="flex flex-wrap gap-2.5">
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
    <ol className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-sm leading-relaxed text-[#5f574e]">
          <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#eaf0f4] text-[11px] font-semibold text-[#3f5e78]">
            {i + 1}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
}

function BreakdownBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-16 text-xs capitalize text-[#7a7268] sm:w-20">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#e5ddd1]">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value ?? 0}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-7 text-right text-xs font-semibold text-[#4b443d]">{value ?? "—"}</span>
    </div>
  );
}

const AREA_COLORS: Record<string, { bg: string; text: string }> = {
  Skills: { bg: "bg-[#eaf0f4]", text: "text-[#3f5e78]" },
  Experience: { bg: "bg-[#f3eee4]", text: "text-[#6f675d]" },
  Education: { bg: "bg-[#e9f1ea]", text: "text-[#5b7f63]" },
};

function ImprovementCard({ item }: { item: PriorityImprovement }) {
  const color = AREA_COLORS[item.area] ?? { bg: "bg-slate-50", text: "text-slate-600" };
  return (
    <div className="dashboard-card space-y-3 rounded-2xl p-4 sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-3">
        <span className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${color.bg} ${color.text}`}>
          {item.area}
        </span>
        <p className="text-sm font-semibold leading-snug text-[#2f2a24]">{item.title}</p>
      </div>
      <p className="text-sm leading-relaxed text-[#5f574e]">{item.detail}</p>
      <div className="flex flex-col gap-1.5 rounded-xl bg-[#f3eee4] px-3 py-2.5 sm:flex-row sm:gap-2">
        <span className="mt-0.5 flex-shrink-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8c847a]">Action</span>
        <p className="text-sm leading-relaxed text-[#4b443d]">{item.action}</p>
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

interface NormalizedProject {
  title: string;
  description: string;
}

function toTitleCase(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function deriveProjectTitle(description: string) {
  const cleaned = description
    .replace(/^[^a-zA-Z0-9]+/, "")
    .replace(/\.$/, "")
    .trim();

  if (!cleaned) return "Project Idea";

  const shortened = cleaned
    .replace(/^(build|create|develop|design|analyze|conduct)\s+/i, "")
    .split(/\s+/)
    .slice(0, 6)
    .join(" ");

  return toTitleCase(shortened) || "Project Idea";
}

function normaliseProjects(raw: string[]): NormalizedProject[] {
  return raw.map((project) => {
    const value = project.trim();
    const colonIndex = value.indexOf(":");
    const hasDelimitedDescription = colonIndex > 0;

    const rawTitle = hasDelimitedDescription ? value.slice(0, colonIndex).trim() : value;
    const rawDescription = hasDelimitedDescription ? value.slice(colonIndex + 1).trim() : "";
    const titleIsGeneric = /^(project|possible project|project idea|idea)$/i.test(rawTitle);
    const looksLikeDescriptionOnly =
      !hasDelimitedDescription && (/^(build|create|develop|design|analyze|conduct)\s+/i.test(value) || value.split(/\s+/).length > 8);
    const description = rawDescription || (looksLikeDescriptionOnly ? value : "");

    return {
      title: titleIsGeneric || looksLikeDescriptionOnly ? deriveProjectTitle(description || value) : rawTitle,
      description,
    };
  });
}

export function MainContent({
  data,
  profileId,
  selectedRole,
  highlightedSectionId,
  highlightSequence = 0,
}: MainContentProps) {
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
  const projects = normaliseProjects(data.possible_projects);

  return (
    <div className="mx-auto max-w-5xl p-5 pb-16 sm:p-8 sm:pb-20">
      {/* Header */}
      <div className="mb-8 border-b border-[var(--border-soft)] pb-5 sm:mb-10 sm:pb-6">
        <h1 className="text-[1.75rem] font-bold tracking-[-0.02em] text-[#2f2a24] sm:text-[2rem]">{role.title ?? "Role Analysis"}</h1>
        {role.description && (
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#7a7268]">{role.description}</p>
        )}
      </div>

      {/* Match Score */}
      <Section title="Match Score">
        <div className="dashboard-card grid gap-5 rounded-[26px] p-4 sm:p-6 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
          <div className="mx-auto rounded-2xl bg-transparent p-3 md:mx-0">
            <SpeedometerArc score={score.overall ?? 0} size={102} showLabel labelText="Total" />
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8c847a]">Overall Fit</p>
              <p className="mt-1 text-sm leading-relaxed text-[#5f574e]">
                Your strongest alignment comes from academic background and core analytical skills. Experience remains the main limiter.
              </p>
            </div>
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
          <div className="rounded-2xl border border-[var(--border-soft)] bg-[#fcfbf8] px-4 py-3 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8c847a]">Assessment</p>
            <p className="mt-1 text-sm font-semibold text-[#3f5e78]">{score.label ?? "Match"}</p>
          </div>
        </div>
      </Section>

      {/* Readiness */}
      <Section title="Readiness">
        <div className="dashboard-card rounded-2xl p-5">
          <span className="mb-3 inline-block rounded-full bg-[#eaf0f4] px-3 py-1 text-xs font-semibold text-[#3f5e78]">
            {readiness.level ?? "—"}
          </span>
          <p className="max-w-4xl text-sm leading-relaxed text-[#5f574e]">{readiness.summary ?? "—"}</p>
        </div>
      </Section>

      {/* Strengths / Weaknesses */}
      <div className="mb-10 grid gap-5 lg:grid-cols-2">
        <div className="dashboard-card rounded-2xl p-4 sm:p-5">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-[#5f574e] sm:text-[15px]">Strengths For This Role</p>
          <TagList items={data.strengths} color="green" />
        </div>
        <div className="dashboard-card rounded-2xl p-4 sm:p-5">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-[#5f574e] sm:text-[15px]">Weaknesses For This Role</p>
          <TagList items={data.weaknesses} color="amber" />
        </div>
      </div>

      {/* Matched / Missing Skills */}
      <div className="mb-10 grid gap-5 lg:grid-cols-2">
        <div className="dashboard-card rounded-2xl p-4 sm:p-5">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-[#5f574e] sm:text-[15px]">Matched Skills</p>
          <TagList items={data.matched_skills} color="blue" />
        </div>
        <div className="dashboard-card rounded-2xl p-4 sm:p-5">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-[#5f574e] sm:text-[15px]">Missing Skills</p>
          <TagList items={data.missing_skills} color="red" />
        </div>
      </div>

      {/* Priority Improvements */}
      <Section
        id="priority-improvements"
        title="Priority Improvements"
        isHighlighted={highlightedSectionId === "priority-improvements"}
        highlightKey={highlightedSectionId === "priority-improvements" ? highlightSequence : 0}
      >
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
      <Section
        id="possible-projects"
        title="Possible Projects"
        isHighlighted={highlightedSectionId === "possible-projects"}
        highlightKey={highlightedSectionId === "possible-projects" ? highlightSequence : 0}
      >
        <div className="space-y-3">
          {projects.map((project, i) => {
            return (
              <button
                key={i}
                onClick={() => handleProjectClick(project.title, project.description)}
                className="dashboard-card group w-full rounded-2xl p-4 text-left transition-all hover:border-[#cfd9e1] hover:bg-[#f8fbfc] hover:shadow-sm sm:p-5"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-semibold text-[#2f2a24]">{project.title}</p>
                  <span className="text-xs text-[#8c847a] transition-colors group-hover:text-[#3f5e78]">View details →</span>
                </div>
                {project.description && (
                  <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-[#7a7268]">{project.description}</p>
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
            const project = projects.find((item) => item.title === modalProjectName);
            loadProjectDetail(modalProjectName, project?.description ?? "");
          }}
        />
      )}

      {/* Goal Pathway */}
      <Section
        id="goal-pathway"
        title="Goal Pathway"
        isHighlighted={highlightedSectionId === "goal-pathway"}
        highlightKey={highlightedSectionId === "goal-pathway" ? highlightSequence : 0}
      >
        <div className="space-y-3">
          {(["short_term", "mid_term", "long_term"] as const).map((key) => (
            pathway[key] && (
              <div key={key} className="dashboard-card flex flex-col gap-2 rounded-2xl p-4 sm:flex-row sm:gap-4">
                <span className="w-auto flex-shrink-0 pt-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8c847a] sm:w-24">
                  {key.replace("_", " ")}
                </span>
                <p className="text-sm leading-relaxed text-[#5f574e]">{pathway[key]}</p>
              </div>
            )
          ))}
        </div>
      </Section>
    </div>
  );
}
