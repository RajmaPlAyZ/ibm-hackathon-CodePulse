"use client";

import { useRef, useState, useEffect } from "react";
import { Bell, CheckCircle, XCircle, AlertTriangle, TrendingUp, AlertOctagon, Activity } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { formatTimeAgo } from "@/lib/utils-app";

// ── Activity type config ───────────────────────────────────

type ActivityType =
  | "scan_completed"
  | "scan_failed"
  | "finding_detected"
  | "health_improved"
  | "health_declined"
  | "repository_connected"
  | "warning"
  | "analysis_done";

interface ActivityIconConfig {
  icon: React.ReactNode;
  bg: string;
}

function getActivityConfig(type: ActivityType): ActivityIconConfig {
  switch (type) {
    case "scan_completed":
      return {
        icon: <CheckCircle className="h-3.5 w-3.5" style={{ color: "#1DDF6B" }} />,
        bg: "rgba(29,223,107,0.12)",
      };
    case "scan_failed":
      return {
        icon: <XCircle className="h-3.5 w-3.5" style={{ color: "#EF4444" }} />,
        bg: "rgba(239,68,68,0.12)",
      };
    case "finding_detected":
      return {
        icon: <AlertTriangle className="h-3.5 w-3.5" style={{ color: "#F97316" }} />,
        bg: "rgba(249,115,22,0.12)",
      };
    case "health_improved":
      return {
        icon: <TrendingUp className="h-3.5 w-3.5" style={{ color: "#1DDF6B" }} />,
        bg: "rgba(29,223,107,0.12)",
      };
    case "health_declined":
      return {
        icon: <TrendingUp className="h-3.5 w-3.5 rotate-180" style={{ color: "#EF4444" }} />,
        bg: "rgba(239,68,68,0.12)",
      };
    case "warning":
      return {
        icon: <AlertOctagon className="h-3.5 w-3.5" style={{ color: "#EAB308" }} />,
        bg: "rgba(234,179,8,0.12)",
      };
    case "analysis_done":
      return {
        icon: <Activity className="h-3.5 w-3.5" style={{ color: "#60A5FA" }} />,
        bg: "rgba(96,165,250,0.12)",
      };
    default:
      return {
        icon: <Bell className="h-3.5 w-3.5" style={{ color: "#8B8BA8" }} />,
        bg: "rgba(139,139,168,0.12)",
      };
  }
}

// ── NotificationBell component ────────────────────────────

export function NotificationBell() {
  const { user } = useUser();
  const userId = user?.id ?? "";

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Only query when we have a userId
  const activities = useQuery(
    api.activities.listByUser,
    userId ? { userId, limit: 8 } : "skip"
  );

  const hasUnread = (activities?.length ?? 0) > 0;

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl transition-all hover:bg-white/8"
        style={{
          border: "1.5px solid rgba(255,255,255,0.09)",
          boxShadow: "0 3px 0 rgba(0,0,0,0.35)",
          background: open ? "rgba(255,255,255,0.06)" : undefined,
        }}
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell className="h-4 w-4" style={{ color: open ? "#FFFFFF" : "#8B8BA8" }} />
        {/* Red dot for unread */}
        {hasUnread && (
          <span
            className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full"
            style={{
              background: "#EF4444",
              boxShadow: "0 0 6px rgba(239,68,68,0.8)",
              border: "1.5px solid #0D0D10",
            }}
          />
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 z-50 rounded-2xl overflow-hidden"
          style={{
            width: 320,
            background: "#1A1A22",
            border: "1.5px solid rgba(255,255,255,0.1)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="flex items-center gap-2">
              <Bell className="h-3.5 w-3.5" style={{ color: "#1DDF6B" }} />
              <span className="text-sm font-black text-white tracking-tight">Notifications</span>
            </div>
            {hasUnread && (
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{
                  background: "rgba(29,223,107,0.12)",
                  color: "#1DDF6B",
                  border: "1px solid rgba(29,223,107,0.2)",
                }}
              >
                {activities?.length} new
              </span>
            )}
          </div>

          {/* Activity list */}
          <div className="max-h-80 overflow-y-auto">
            {activities === undefined ? (
              // Loading state
              <div className="flex flex-col gap-2 px-4 py-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-3 animate-pulse">
                    <div className="h-7 w-7 rounded-lg flex-shrink-0" style={{ background: "rgba(255,255,255,0.06)" }} />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 rounded" style={{ background: "rgba(255,255,255,0.06)", width: "80%" }} />
                      <div className="h-2.5 rounded" style={{ background: "rgba(255,255,255,0.04)", width: "40%" }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : activities.length === 0 ? (
              // Empty state
              <div className="flex flex-col items-center justify-center px-4 py-8 gap-2">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.06)" }}
                >
                  <Bell className="h-5 w-5" style={{ color: "#4D4D66" }} />
                </div>
                <p className="text-sm font-semibold" style={{ color: "#8B8BA8" }}>
                  No notifications yet
                </p>
                <p className="text-[11px] text-center" style={{ color: "#4D4D66" }}>
                  Activity from scans and repositories will appear here
                </p>
              </div>
            ) : (
              // Activity rows
              <div className="py-1">
                {activities.map((activity) => {
                  const config = getActivityConfig(activity.type as ActivityType);
                  const timeAgo = formatTimeAgo(new Date(activity.createdAt));

                  return (
                    <div
                      key={activity._id}
                      className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-white/4 cursor-pointer"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                    >
                      {/* Icon */}
                      <div
                        className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg mt-0.5"
                        style={{ background: config.bg }}
                      >
                        {config.icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-[13px] font-medium leading-snug"
                          style={{ color: "rgba(255,255,255,0.85)" }}
                        >
                          {activity.message}
                        </p>
                        <p
                          className="text-[11px] font-semibold uppercase tracking-wider mt-0.5"
                          style={{ color: "#4D4D66" }}
                        >
                          {timeAgo}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {(activities?.length ?? 0) > 0 && (
            <div
              className="px-4 py-2.5"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
            >
              <button
                className="w-full text-center text-[11px] font-bold uppercase tracking-wider transition-colors hover:opacity-80"
                style={{ color: "#1DDF6B" }}
              >
                View all activity
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
