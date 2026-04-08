"use client";

/**
 * Shared speedometer arc used in both LeftSidebar and MainContent.
 * 270° arc, gap at the bottom.
 * Fill colour darkens as score rises (score-based colour mapping).
 */

export function scoreToArcColor(score: number): string {
  if (score >= 80) return "#3f5e78";
  if (score >= 60) return "#4c6b84";
  if (score >= 40) return "#6f8799";
  return "#b8c7d3";
}

export function scoreToTextColor(score: number): string {
  if (score >= 80) return "#2f4b61";
  if (score >= 60) return "#36546d";
  if (score >= 40) return "#48677f";
  return "#6f8799";
}

interface SpeedometerArcProps {
  score: number;
  /** Outer size of the SVG square in px (default 56) */
  size?: number;
  /** Whether to show "Total" sub-label below the number */
  showLabel?: boolean;
  labelText?: string;
}

export function SpeedometerArc({
  score,
  size = 56,
  showLabel = false,
  labelText = "Total",
}: SpeedometerArcProps) {
  const cx = size / 2;
  const cy = size / 2;
  // Radius scales with size; matches original sidebar at size=56 (r=22)
  const r = Math.round(size * 0.393);
  const strokeTrack = Math.round(size * 0.071);
  const strokeFill  = strokeTrack + Math.round(size * 0.009);

  const circumference = 2 * Math.PI * r;
  const trackLength   = circumference * 0.75;
  const safeScore     = Math.min(Math.max(score, 0), 100);
  const fillLength    = trackLength * (safeScore / 100);

  const arcColor   = scoreToArcColor(score);
  const textColor  = scoreToTextColor(score);
  const trackColor = "#dde6ec";

  const numFontSize   = Math.round(size * 0.236);
  const labelFontSize = Math.round(size * 0.125);

  return (
    <div
      className="relative flex-shrink-0 flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0"
      >
        {/* Background track — 270° */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeTrack}
          strokeDasharray={`${trackLength} ${circumference - trackLength}`}
          strokeLinecap="round"
          transform={`rotate(135, ${cx}, ${cy})`}
        />
        {/* Score fill */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={arcColor}
          strokeWidth={strokeFill}
          strokeDasharray={`${fillLength} ${circumference - fillLength}`}
          strokeLinecap="round"
          transform={`rotate(135, ${cx}, ${cy})`}
          style={{ transition: "stroke-dasharray 0.6s ease, stroke 0.4s ease" }}
        />
      </svg>

      {/* Centre text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span
          style={{
            fontSize: numFontSize,
            fontWeight: 700,
            color: textColor,
            transition: "color 0.4s ease",
            lineHeight: 1,
          }}
        >
          {score}
        </span>
        {showLabel && (
          <span
            style={{
              fontSize: labelFontSize,
              color: "#90867d",
              marginTop: Math.round(size * 0.042),
              lineHeight: 1,
            }}
          >
            {labelText}
          </span>
        )}
      </div>
    </div>
  );
}
