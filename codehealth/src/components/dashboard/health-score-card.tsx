"use client";

function getHealthColor(score: number) {
  if (score >= 80) return { color: "#14E678", glow: "rgba(20,230,120,0.4)", stop1: "#0FCC68", stop2: "#4DFFA0" };
  if (score >= 60) return { color: "#F5A623", glow: "rgba(245,166,35,0.4)", stop1: "#D4880A", stop2: "#FBC94A" };
  return       { color: "#F04060", glow: "rgba(240,64,96,0.4)",  stop1: "#C0253A", stop2: "#FF7090" };
}

interface HealthScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
}

export function HealthScoreRing({
  score,
  size = 120,
  strokeWidth = 8,
  showLabel = true,
}: HealthScoreRingProps) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (score / 100) * circumference;
  const { color, glow, stop1, stop2 } = getHealthColor(score);
  const center = size / 2;
  const gradId = `ring-grad-${size}-${score}`;
  const filterId = `ring-glow-${size}`;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="-rotate-90"
        style={{ overflow: "visible" }}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={stop1} />
            <stop offset="100%" stopColor={stop2} />
          </linearGradient>
          <filter id={filterId} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer subtle halo */}
        <circle
          cx={center}
          cy={center}
          r={radius + strokeWidth * 0.6}
          fill="none"
          stroke={color}
          strokeWidth={1}
          strokeDasharray={circumference + strokeWidth * 4}
          strokeDashoffset={circumference + strokeWidth * 4 - (score / 100) * (circumference + strokeWidth * 4)}
          strokeLinecap="round"
          opacity="0.08"
        />

        {/* Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />

        {/* Glow copy */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth + 3}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          opacity="0.15"
          filter={`url(#${filterId})`}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
        />

        {/* Main ring */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
        />
      </svg>

      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          <span
            className="font-bold leading-none"
            style={{
              fontSize: size * 0.22,
              letterSpacing: "-0.04em",
              color,
              textShadow: `0 0 16px ${glow}`,
            }}
          >
            {score}
          </span>
          <span
            className="font-medium leading-none"
            style={{ fontSize: size * 0.085, color: "#404060" }}
          >
            / 100
          </span>
        </div>
      )}
    </div>
  );
}
