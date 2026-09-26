"use client";

function getHealthColor(score: number): string {
  if (score >= 80) return "#1DDF6B";
  if (score >= 60) return "#FFB830";
  return "#FF4D6D";
}

function getGlowColor(score: number): string {
  if (score >= 80) return "rgba(29,223,107,0.35)";
  if (score >= 60) return "rgba(255,184,48,0.35)";
  return "rgba(255,77,109,0.35)";
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
  strokeWidth = 10,
  showLabel = true,
}: HealthScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (score / 100) * circumference;
  const color = getHealthColor(score);
  const glowColor = getGlowColor(score);
  const center = size / 2;
  const gradId = `ring-grad-${score}`;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gradId} x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.5" />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
          <filter id={`glow-${score}`}>
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        {/* Track inner highlight */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.02)"
          strokeWidth={strokeWidth - 2}
        />

        {/* Glow ring (blurred copy) */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth + 2}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          opacity="0.15"
          filter={`url(#glow-${score})`}
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
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
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
        />
      </svg>

      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-black leading-none"
            style={{
              fontSize: size * 0.22,
              color,
              textShadow: `0 0 12px ${glowColor}`,
            }}
          >
            {score}
          </span>
          <span
            className="font-bold leading-none mt-0.5"
            style={{ fontSize: size * 0.1, color: "#4D4D66" }}
          >
            /100
          </span>
        </div>
      )}
    </div>
  );
}
