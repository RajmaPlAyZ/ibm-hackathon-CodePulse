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
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/repositories", label: "Repositories", icon: FolderGit2 },
  { href: "/scans", label: "Scans", icon: ScanLine },
  { href: "/findings", label: "Findings", icon: AlertTriangle },
  { href: "/ai-insights", label: "AI Insights", icon: Sparkles },
  { href: "/workflows", label: "Workflows", icon: Workflow },
  { href: "/history", label: "History", icon: History },
];

const bottomItems = [
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/help", label: "Help", icon: HelpCircle },
];

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useUser();

  return (
    <div
      className="flex h-full w-64 flex-col relative overflow-hidden"
      style={{
        background: "#14141A",
        borderRight: "1.5px solid rgba(255,255,255,0.07)",
        boxShadow: "4px 0 24px rgba(0,0,0,0.4)",
      }}
    >
      {/* Subtle dot-grid background decoration */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />

      {/* Logo */}
      <div className="relative flex items-center justify-between px-5 py-5">
        <Link href="/dashboard" className="flex items-center gap-3" onClick={onClose}>
          <div
            className="flex h-10 w-10 items-center justify-center rounded-2xl relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #0F8040, #1DDF6B)",
              border: "1.5px solid rgba(29,223,107,0.5)",
              boxShadow: "0 4px 0 #0A4D28, 0 0 20px rgba(29,223,107,0.3)",
            }}
          >
            <Activity className="h-5 w-5 text-white relative z-10" />
          </div>
          <div>
            <span className="text-sm font-black text-white tracking-tight">CodeHealth</span>
            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#4D4D66" }}>
              IBM Hackathon
            </p>
          </div>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 transition-colors hover:bg-white/8 text-gray-500"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Section label */}
      <div className="relative px-5 pb-2">
        <span className="section-label">Navigation</span>
      </div>

      {/* Navigation */}
      <nav className="relative flex-1 px-3 py-1 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-all duration-150 relative",
                isActive
                  ? "nav-active text-white"
                  : "text-[#8B8BA8] hover:text-white hover:bg-white/5"
              )}
            >
              <div
                className={cn(
                  "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl transition-all",
                  isActive
                    ? ""
                    : "group-hover:bg-white/8"
                )}
                style={
                  isActive
                    ? {
                        background: "rgba(29,223,107,0.2)",
                        boxShadow: "0 0 10px rgba(29,223,107,0.2)",
                      }
                    : {}
                }
              >
                <Icon
                  className="h-3.5 w-3.5"
                  style={{ color: isActive ? "#1DDF6B" : undefined }}
                />
              </div>
              <span>{item.label}</span>
              {isActive && (
                <div className="ml-auto glow-dot-green" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="relative px-4 py-2">
        <div style={{ height: "1.5px", background: "rgba(255,255,255,0.06)", borderRadius: "9999px" }} />
      </div>

      {/* Bottom items */}
      <div className="relative px-3 pb-2 space-y-0.5">
        <div className="px-2 pb-1">
          <span className="section-label">General</span>
        </div>
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-all",
                isActive ? "nav-active" : "text-[#8B8BA8] hover:text-white hover:bg-white/5"
              )}
            >
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl group-hover:bg-white/8 transition-all">
                <Icon className="h-3.5 w-3.5" style={{ color: isActive ? "#1DDF6B" : undefined }} />
              </div>
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* User card */}
      <div className="relative p-3 pt-1">
        <div
          className="flex items-center gap-3 rounded-2xl px-3 py-2.5 cursor-pointer transition-all hover:bg-white/5"
          style={{ border: "1.5px solid rgba(255,255,255,0.07)", boxShadow: "0 3px 0 rgba(0,0,0,0.3)" }}
        >
          <UserButton
            appearance={{
              elements: { avatarBox: "h-7 w-7 rounded-xl" },
            }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">
              {user?.firstName ?? "Developer"}
            </p>
            <p className="text-[10px] font-medium truncate" style={{ color: "#4D4D66" }}>
              {user?.primaryEmailAddress?.emailAddress ?? "user@example.com"}
            </p>
          </div>
          <div
            className="h-2 w-2 rounded-full flex-shrink-0"
            style={{ background: "#1DDF6B", boxShadow: "0 0 6px #1DDF6B" }}
          />
        </div>
      </div>
    </div>
  );
}
