"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  delta?: number | null;
  deltaLabel?: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
  accentColor?: string;
}

export function MetricCard({
  title,
  value,
  delta,
  deltaLabel,
  subtitle,
  children,
  className,
  accentColor = "#14E678",
}: MetricCardProps) {
  const isPositive = delta != null && delta >= 0;

  // Compute a dimmed version of the accent for the card tint
  const accentHex = accentColor.replace("#", "");
  const r = parseInt(accentHex.slice(0, 2), 16);
  const g = parseInt(accentHex.slice(2, 4), 16);
  const b = parseInt(accentHex.slice(4, 6), 16);
  const accentDim = `rgba(${r},${g},${b},0.06)`;
  const accentBorder = `rgba(${r},${g},${b},0.18)`;
  const accentGlow = `rgba(${r},${g},${b},0.3)`;

  return (
    <div
      className={cn("relative overflow-hidden rounded-2xl p-5 transition-all duration-200", className)}
      style={{
        background: `linear-gradient(135deg, ${accentDim} 0%, rgba(255,255,255,0.025) 100%)`,
        border: `1px solid ${accentBorder}`,
        boxShadow: `0 4px 16px rgba(0,0,0,0.3), 0 0 20px ${accentDim}, inset 0 1px 0 rgba(255,255,255,0.05)`,
      }}
    >
      {/* Ambient glow corner */}
      <div
        className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full"
        style={{
          background: `radial-gradient(circle, ${accentGlow} 0%, transparent 70%)`,
          opacity: 0.4,
        }}
      />

      {/* Label row */}
      <div className="relative flex items-center justify-between mb-3">
        <p className="section-label">{title}</p>
        {delta != null && (
          <div
            className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{
              background: isPositive ? "rgba(20,230,120,0.1)" : "rgba(240,64,96,0.1)",
              color: isPositive ? "#14E678" : "#F04060",
              border: `1px solid ${isPositive ? "rgba(20,230,120,0.2)" : "rgba(240,64,96,0.2)"}`,
            }}
          >
            {isPositive ? (
              <TrendingUp style={{ width: 10, height: 10 }} />
            ) : (
              <TrendingDown style={{ width: 10, height: 10 }} />
            )}
            {isPositive ? "+" : ""}
            {delta}
            {deltaLabel}
          </div>
        )}
      </div>

      {/* Value */}
      <div className="relative mb-2">
        <span
          className="font-bold leading-none tracking-tight"
          style={{
            fontSize: "1.875rem",
            letterSpacing: "-0.04em",
            color: accentColor,
            textShadow: `0 0 24px ${accentGlow}`,
          }}
        >
          {value}
        </span>
      </div>

      {subtitle && (
        <p className="relative text-[11px] font-medium mb-2" style={{ color: "#404060" }}>
          {subtitle}
        </p>
      )}

      {children && <div className="relative">{children}</div>}
    </div>
  );
}
