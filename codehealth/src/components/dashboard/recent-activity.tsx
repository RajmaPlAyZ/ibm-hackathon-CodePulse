"use client";

import { CheckCircle2, AlertTriangle, TrendingUp, ScanLine } from "lucide-react";
import { formatTimeAgo } from "@/lib/utils-app";
import type { Activity } from "@/lib/types";

interface RecentActivityProps {
  activities: Activity[];
}

const activityConfig: Record<Activity["type"], { color: string; bg: string; icon: typeof ScanLine }> = {
  scan_completed:  { color: "#1DDF6B", bg: "rgba(29,223,107,0.12)",  icon: ScanLine },
  health_improved: { color: "#1DDF6B", bg: "rgba(29,223,107,0.12)",  icon: TrendingUp },
  warning:         { color: "#FFB830", bg: "rgba(255,184,48,0.12)",   icon: AlertTriangle },
  analysis_done:   { color: "#4E9EFF", bg: "rgba(78,158,255,0.12)",   icon: CheckCircle2 },
  finding_detected:{ color: "#FF4D6D", bg: "rgba(255,77,109,0.12)",   icon: AlertTriangle },
};

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <div className="card-comic p-5">
      <div className="mb-4">
        <h2 className="text-sm font-black text-white">Recent Activity</h2>
        <p className="text-[11px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: "#4D4D66" }}>
          Last scan events
        </p>
      </div>

      <div className="space-y-1.5">
        {activities.map((activity, i) => {
          const cfg = activityConfig[activity.type] ?? activityConfig.analysis_done;
          const Icon = cfg.icon;
          return (
            <div
              key={activity.id}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/4"
              style={{
                borderLeft: `3px solid ${cfg.color}30`,
                background: i === 0 ? "rgba(255,255,255,0.03)" : "transparent",
              }}
            >
              {/* Icon bubble */}
              <div
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl"
                style={{ background: cfg.bg, border: `1px solid ${cfg.color}25` }}
              >
                <Icon className="h-3.5 w-3.5" style={{ color: cfg.color }} />
              </div>

              <p className="flex-1 text-sm font-semibold text-white">{activity.message}</p>

              <span className="text-[10px] font-bold flex-shrink-0" style={{ color: "#4D4D66" }}>
                {formatTimeAgo(activity.timestamp)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
