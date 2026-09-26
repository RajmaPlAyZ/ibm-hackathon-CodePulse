"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  delta?: number;
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
  accentColor = "#1DDF6B",
}: MetricCardProps) {
  const isPositive = delta !== undefined && delta >= 0;

  return (
    <div
      className={cn("card-comic p-5", className)}
    >
      {/* Label */}
      <div className="flex items-center justify-between mb-3">
        <p className="section-label">{title}</p>
        {delta !== undefined && (
          <div
            className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold"
            style={{
              background: isPositive ? "rgba(29,223,107,0.15)" : "rgba(255,77,109,0.15)",
              color: isPositive ? "#1DDF6B" : "#FF4D6D",
              border: `1.5px solid ${isPositive ? "rgba(29,223,107,0.3)" : "rgba(255,77,109,0.3)"}`,
              boxShadow: "0 2px 0 rgba(0,0,0,0.3)",
            }}
          >
            {isPositive ? (
              <TrendingUp className="h-2.5 w-2.5" />
            ) : (
              <TrendingDown className="h-2.5 w-2.5" />
            )}
            {isPositive ? "+" : ""}{delta}{deltaLabel}
          </div>
        )}
      </div>

      {/* Value */}
      <div className="mb-3">
        <span
          className="font-black leading-none"
          style={{
            fontSize: "2rem",
            letterSpacing: "-0.03em",
            color: accentColor,
            textShadow: `0 0 20px ${accentColor}40`,
          }}
        >
          {value}
        </span>
      </div>

      {subtitle && (
        <p className="text-[11px] font-medium mb-2" style={{ color: "#4D4D66" }}>
          {subtitle}
        </p>
      )}
      {children}
    </div>
  );
}
