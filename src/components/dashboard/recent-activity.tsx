"use client";

import { CheckCircle2, AlertTriangle, TrendingUp, ScanLine } from "lucide-react";
import { formatTimeAgo } from "@/lib/utils-app";
import type { Activity } from "@/lib/types";

interface RecentActivityProps {
  activities: Activity[];
}

const activityConfig: Record<Activity["type"], { color: string; bg: string; icon: typeof ScanLine }> = {
  scan_completed:   { color: "#14E678", bg: "rgba(20,230,120,0.10)",  icon: ScanLine },
  health_improved:  { color: "#14E678", bg: "rgba(20,230,120,0.10)",  icon: TrendingUp },
  warning:          { color: "#F5A623", bg: "rgba(245,166,35,0.10)",  icon: AlertTriangle },
  analysis_done:    { color: "#4D9EFF", bg: "rgba(77,158,255,0.10)",  icon: CheckCircle2 },
  finding_detected: { color: "#F04060", bg: "rgba(240,64,96,0.10)",   icon: AlertTriangle },
};

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <div className="card-glass p-5">
      <div className="mb-4">
        <h2 className="text-[13px] font-semibold text-white" style={{ letterSpacing: "-0.01em" }}>
          Recent Activity
        </h2>
        <p className="section-label mt-0.5">Last scan events</p>
      </div>

      <div className="space-y-1.5">
        {activities.length === 0 && (
          <p className="text-[12px] py-4 text-center" style={{ color: "#404060" }}>
            No activity yet. Run a scan to get started.
          </p>
        )}
        {activities.map((activity, i) => {
          const cfg = activityConfig[activity.type] ?? activityConfig.analysis_done;
          const Icon = cfg.icon;
          return (
            <div
              key={activity.id}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/4"
              style={{
                borderLeft: `2px solid ${cfg.color}30`,
                background: i === 0 ? "rgba(255,255,255,0.025)" : "transparent",
              }}
            >
              <div
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl"
                style={{ background: cfg.bg, border: `1px solid ${cfg.color}20` }}
              >
                <Icon className="h-3.5 w-3.5" style={{ color: cfg.color }} />
              </div>
              <p className="flex-1 text-[12px] font-medium text-white leading-snug">
                {activity.message}
              </p>
              <span className="text-[10px] font-medium flex-shrink-0" style={{ color: "#404060" }}>
                {formatTimeAgo(activity.timestamp)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
