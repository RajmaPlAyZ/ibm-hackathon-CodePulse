"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderGit2,
  ScanLine,
  AlertTriangle,
  Sparkles,
  Workflow,
  History,
  Settings,
  HelpCircle,
  Activity,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserButton, useUser } from "@clerk/nextjs";

const navItems = [
  { href: "/dashboard",    label: "Dashboard",   icon: LayoutDashboard },
  { href: "/repositories", label: "Repositories", icon: FolderGit2 },
  { href: "/scans",        label: "Scans",        icon: ScanLine },
  { href: "/findings",     label: "Findings",     icon: AlertTriangle },
  { href: "/ai-insights",  label: "AI Insights",  icon: Sparkles },
  { href: "/workflows",    label: "Workflows",    icon: Workflow },
  { href: "/history",      label: "History",      icon: History },
];

const bottomItems = [
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/help",     label: "Help",     icon: HelpCircle },
];

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useUser();

  return (
    <div
      className="flex h-full w-60 flex-col relative overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #0C0C16 0%, #0A0A14 100%)",
        borderRight: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {/* Ambient top glow */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-48"
        style={{
          background: "radial-gradient(ellipse 120% 60% at 50% -20%, rgba(20,230,120,0.07) 0%, transparent 70%)",
        }}
      />

      {/* Logo */}
      <div className="relative flex items-center justify-between px-4 py-5">
        <Link href="/dashboard" className="flex items-center gap-3 group" onClick={onClose}>
          {/* Icon mark */}
          <div
            className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #0A9B50 0%, #14E678 100%)",
              boxShadow: "0 0 20px rgba(20,230,120,0.25), inset 0 1px 0 rgba(255,255,255,0.25)",
              border: "1px solid rgba(20,230,120,0.4)",
            }}
          >
            <Activity className="h-4.5 w-4.5 text-white relative z-10" style={{ width: 18, height: 18 }} />
          </div>

          {/* Wordmark */}
          <div className="leading-none">
            <span
              className="text-[15px] font-semibold tracking-tight"
              style={{ color: "#F0F0FF", letterSpacing: "-0.02em" }}
            >
              CodeHealth
            </span>
            <p className="text-[10px] font-medium mt-0.5" style={{ color: "#404060" }}>
              IBM Hackathon
            </p>
          </div>
        </Link>

        {onClose && (
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 transition-colors hover:bg-white/6"
            style={{ color: "#404060" }}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Nav section label */}
      <div className="relative px-4 pb-2">
        <span className="section-label tracking-widest" style={{ color: "#2A2A50" }}>Menu</span>
      </div>

      {/* Main nav */}
      <nav className="relative flex-1 px-2 space-y-0.5 overflow-y-auto pb-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-150 relative",
                isActive
                  ? "nav-active"
                  : "text-[#7878A0] hover:text-[#F0F0FF] hover:bg-white/5"
              )}
              style={
                isActive
                  ? { boxShadow: "0 0 12px rgba(20,230,120,0.06), inset 0 1px 0 rgba(20,230,120,0.05)" }
                  : {}
              }
            >
              {/* Icon */}
              <div
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg transition-all"
                style={
                  isActive
                    ? {
                        background: "rgba(20,230,120,0.15)",
                        boxShadow: "0 0 8px rgba(20,230,120,0.15)",
                      }
                    : {}
                }
              >
                <Icon
                  style={{ width: 14, height: 14, color: isActive ? "#14E678" : "inherit" }}
                />
              </div>

              <span className="flex-1 leading-none">{item.label}</span>

              {/* Active indicator dot */}
              {isActive && <div className="glow-dot-green pulse-glow" />}
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-4 my-1">
        <div
          style={{
            height: "1px",
            background: "rgba(255,255,255,0.05)",
          }}
        />
      </div>

      {/* Bottom items */}
      <div className="relative px-2 py-2 space-y-0.5">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all",
                isActive
                  ? "nav-active"
                  : "text-[#7878A0] hover:text-[#F0F0FF] hover:bg-white/5"
              )}
            >
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg">
                <Icon
                  style={{ width: 14, height: 14, color: isActive ? "#14E678" : "inherit" }}
                />
              </div>
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* User card */}
      <div className="relative px-3 pb-4 pt-1">
        <div
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 cursor-pointer transition-all hover:bg-white/4"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <UserButton
            appearance={{
              elements: { avatarBox: "h-7 w-7 rounded-lg" },
            }}
          />
          <div className="flex-1 min-w-0 leading-none">
            <p className="text-[12px] font-semibold truncate" style={{ color: "#F0F0FF" }}>
              {user?.firstName ?? "Developer"} {user?.lastName ?? ""}
            </p>
            <p className="text-[10px] font-medium truncate mt-0.5" style={{ color: "#404060" }}>
              {user?.primaryEmailAddress?.emailAddress ?? "user@example.com"}
            </p>
          </div>
          <div
            className="h-1.5 w-1.5 rounded-full flex-shrink-0"
            style={{ background: "#14E678", boxShadow: "0 0 6px #14E678" }}
          />
        </div>
      </div>
    </div>
  );
}
