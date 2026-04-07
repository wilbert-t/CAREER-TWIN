import type { RoleSuggestion } from "@/lib/types";

interface LeftSidebarProps {
  candidateName: string;
  roles: RoleSuggestion[];
  selectedRole: string;
  onRoleSwitch: (role: RoleSuggestion) => void;
  isSwitching: boolean;
}

export function LeftSidebar({
  candidateName,
  roles,
  selectedRole,
  onRoleSwitch,
  isSwitching,
}: LeftSidebarProps) {
  return (
    <aside className="flex flex-col gap-4 p-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Candidate</p>
        <p className="mt-1 font-semibold text-slate-800 truncate">{candidateName || "—"}</p>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
          Career Paths
        </p>
        <ul className="space-y-1">
          {roles.map((role) => {
            const isActive = role.title === selectedRole || role.id === selectedRole;
            return (
              <li key={role.id}>
                <button
                  onClick={() => !isActive && !isSwitching && onRoleSwitch(role)}
                  disabled={isActive || isSwitching}
                  className={[
                    "w-full text-left rounded-lg px-3 py-2 transition-colors",
                    isActive
                      ? "bg-blue-500 text-white"
                      : isSwitching
                      ? "text-slate-400 cursor-not-allowed"
                      : "text-slate-600 hover:bg-slate-100 cursor-pointer",
                  ].join(" ")}
                >
                  <p className="text-sm font-medium truncate">{role.title}</p>
                  <p
                    className={[
                      "text-xs",
                      isActive ? "text-blue-100" : "text-slate-400",
                    ].join(" ")}
                  >
                    {role.preview_match_score}% match
                  </p>
                </button>
              </li>
            );
          })}
          {roles.length === 0 && (
            <li>
              <div className="rounded-lg bg-blue-500 px-3 py-2">
                <p className="text-sm font-medium text-white truncate">{selectedRole}</p>
                <p className="text-xs text-blue-100">Custom role</p>
              </div>
            </li>
          )}
        </ul>
      </div>
    </aside>
  );
}
