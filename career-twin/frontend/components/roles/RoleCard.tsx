import { useEffect, useRef, useState } from "react";
import type { RoleSuggestion } from "@/lib/types";
import { SpeedometerArc } from "@/components/dashboard/SpeedometerArc";

interface RoleCardProps {
  role: RoleSuggestion;
  selected: boolean;
  onSelect: (id: string) => void;
}

export function RoleCard({ role, selected, onSelect }: RoleCardProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const frameRef = useRef<number | null>(null);
  const displayScoreRef = useRef(0);

  useEffect(() => {
    displayScoreRef.current = displayScore;
  }, [displayScore]);

  useEffect(() => {
    const target = Math.max(0, Math.min(100, role.preview_match_score ?? 0));
    const start = displayScoreRef.current;

    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
    }

    if (start === target) {
      return;
    }

    const duration = 700;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const nextValue = Math.round(start + (target - start) * eased);

      setDisplayScore(nextValue);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        frameRef.current = null;
      }
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [role.preview_match_score]);

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
          <SpeedometerArc score={displayScore} size={72} />
        </div>

        <div className="flex-1 min-w-0">
          <p className={[
            "font-bold text-base leading-tight",
            selected ? "text-indigo-900" : "text-slate-800",
          ].join(" ")}>
            {role.title}
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
