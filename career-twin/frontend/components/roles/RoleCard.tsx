import type { RoleSuggestion } from "@/lib/types";
import { SpeedometerArc } from "@/components/dashboard/SpeedometerArc";

interface RoleCardProps {
  role: RoleSuggestion;
  selected: boolean;
  loading?: boolean;
  onSelect: (id: string) => void;
}

export function RoleCard({ role, selected, loading = false, onSelect }: RoleCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(role.id)}
      className={[
        "w-full text-left rounded-2xl border px-5 py-4 transition-all duration-150",
        selected
          ? "border-indigo-200 bg-indigo-50 shadow-sm"
          : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50 hover:shadow-sm",
      ].join(" ")}
    >
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <SpeedometerArc score={role.preview_match_score} size={72} />
          {loading && (
            <div className="absolute inset-0 rounded-full flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-indigo-200 border-t-indigo-500 animate-spin" style={{ borderRadius: "50%" }} />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className={[
            "font-bold text-base leading-tight",
            selected ? "text-indigo-900" : "text-slate-800",
          ].join(" ")}>
            {role.title}
            {loading && <span className="ml-2 text-xs font-normal text-indigo-400">Analysing…</span>}
          </p>
          <p className={[
            "text-sm mt-0.5 leading-snug",
            selected ? "text-indigo-600" : "text-slate-500",
          ].join(" ")}>
            {role.short_description}
          </p>
        </div>
      </div>

      {/* Skill chips */}
      {role.skills && role.skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {role.skills.map((skill) => (
            <span
              key={skill}
              className={[
                "rounded-full px-2.5 py-0.5 text-xs font-medium",
                selected
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-slate-100 text-slate-600",
              ].join(" ")}
            >
              {skill}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}
