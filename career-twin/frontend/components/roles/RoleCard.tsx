import type { RoleSuggestion } from "@/lib/types";

interface RoleCardProps {
  role: RoleSuggestion;
  selected: boolean;
  onSelect: (id: string) => void;
}

export function RoleCard({ role, selected, onSelect }: RoleCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(role.id)}
      className={[
        "flex flex-col items-center gap-3 rounded-2xl border-2 p-6 text-center",
        "transition-all duration-150 cursor-pointer w-full",
        selected
          ? "border-blue-500 bg-blue-50 shadow-md"
          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm",
      ].join(" ")}
    >
      {/* Score badge */}
      <div
        className={[
          "flex h-14 w-14 items-center justify-center rounded-full text-lg font-extrabold",
          selected ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-600",
        ].join(" ")}
      >
        {role.preview_match_score}%
      </div>

      <div>
        <p className={["font-bold text-base", selected ? "text-blue-900" : "text-slate-800"].join(" ")}>
          {role.title}
        </p>
        <p className="mt-1 text-sm text-slate-500 leading-snug">{role.short_description}</p>
      </div>

      {selected && (
        <span className="rounded-full bg-blue-500 px-3 py-0.5 text-xs font-semibold text-white">
          Selected ✓
        </span>
      )}
    </button>
  );
}
