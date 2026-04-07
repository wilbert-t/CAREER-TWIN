import type { AnalyzeRoleFitResponse } from "@/lib/types";

interface MainContentProps {
  data: AnalyzeRoleFitResponse;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
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

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc list-inside space-y-1">
      {items.map((item, i) => (
        <li key={i} className="text-sm text-slate-700 leading-relaxed">{item}</li>
      ))}
    </ul>
  );
}

export function MainContent({ data }: MainContentProps) {
  const role = data.selected_role as { title?: string; description?: string };
  const score = data.match_score as { overall?: number; label?: string };
  const breakdown = data.score_breakdown as { skills?: number; experience?: number; education?: number };
  const readiness = data.readiness_summary as { level?: string; summary?: string };
  const pathway = data.goal_pathway as { short_term?: string; mid_term?: string; long_term?: string };

  return (
    <div className="p-6 pb-16">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{role.title ?? "Role Analysis"}</h1>
          {role.description && (
            <p className="mt-1 text-sm text-slate-500">{role.description}</p>
          )}
        </div>
        <div className="flex-shrink-0 rounded-xl bg-blue-500 px-4 py-2 text-center">
          <p className="text-2xl font-extrabold text-white">{score.overall ?? "—"}%</p>
          <p className="text-xs text-blue-100">{score.label ?? "Match"}</p>
        </div>
      </div>

      {/* Score breakdown */}
      {breakdown && (
        <Section title="Score Breakdown">
          <div className="grid grid-cols-3 gap-3">
            {(["skills", "experience", "education"] as const).map((key) => (
              <div key={key} className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
                <p className="text-xl font-bold text-slate-800">{breakdown[key] ?? "—"}%</p>
                <p className="text-xs text-slate-500 capitalize">{key}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Readiness */}
      <div id="readiness-section">
      <Section title="Readiness">
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <span className="inline-block rounded-full bg-blue-100 px-3 py-0.5 text-xs font-semibold text-blue-700 mb-2">
            {readiness.level ?? "—"}
          </span>
          <p className="text-sm text-slate-700 leading-relaxed">{readiness.summary ?? "—"}</p>
        </div>
      </Section>
      </div>

      {/* Strengths / Weaknesses */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Strengths</p>
          <TagList items={data.strengths} color="green" />
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Weaknesses</p>
          <TagList items={data.weaknesses} color="amber" />
        </div>
      </div>

      {/* Skills */}
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

      <Section title="Priority Improvements">
        <NumberedList items={data.priority_improvements} />
      </Section>

      <Section title="Learning Steps">
        <NumberedList items={data.learning_steps} />
      </Section>

      <Section title="Possible Projects">
        <div className="space-y-2">
          {data.possible_projects.map((project, i) => {
            const [name, ...rest] = project.split(":");
            return (
              <div key={i} className="rounded-xl border border-slate-100 bg-white p-4">
                <p className="font-semibold text-slate-800 text-sm">{name.trim()}</p>
                {rest.length > 0 && (
                  <p className="text-sm text-slate-500 mt-1">{rest.join(":").trim()}</p>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="Resume Improvements">
        <BulletList items={data.resume_improvements} />
      </Section>

      <Section title="Alternative Roles">
        <TagList items={data.alternative_roles} color="blue" />
      </Section>

      <Section title="Goal Pathway">
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
