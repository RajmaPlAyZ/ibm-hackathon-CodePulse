import type { Severity } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SeverityBadgeProps {
  severity: Severity;
  className?: string;
}

const severityClass: Record<Severity, string> = {
  critical: "badge-comic badge-critical",
  high: "badge-comic badge-high",
  medium: "badge-comic badge-medium",
  low: "badge-comic badge-low",
};

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  return (
    <span className={cn(severityClass[severity], className)}>
      {severity}
    </span>
  );
}
