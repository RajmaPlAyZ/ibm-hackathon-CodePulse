"use client";

import { Search, Zap } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { MobileNav } from "./mobile-nav";
import { NotificationBell } from "./notification-bell";

interface HeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function Header({ title, subtitle, children }: HeaderProps) {
  return (
    <div className="frosted-bar flex h-14 items-center justify-between px-6 shrink-0 relative">
      {/* Subtle bottom glow line */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(20,230,120,0.15) 40%, rgba(20,230,120,0.15) 60%, transparent 100%)",
        }}
      />

      {/* Left */}
      <div className="flex items-center gap-4 min-w-0">
        <div className="lg:hidden">
          <MobileNav />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1
              className="text-sm font-semibold leading-tight truncate"
              style={{ color: "#F0F0FF", letterSpacing: "-0.01em" }}
            >
              {title}
            </h1>
            {subtitle && (
              <>
                <span style={{ color: "#2A2A50" }}>/</span>
                <span
                  className="text-xs font-medium hidden sm:block"
                  style={{ color: "#7878A0" }}
                >
                  {subtitle}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {children}

        {/* Search */}
        <button
          className="flex h-8 w-8 items-center justify-center rounded-lg transition-all hover:bg-white/6"
          style={{ border: "1px solid rgba(255,255,255,0.08)" }}
          aria-label="Search"
        >
          <Search style={{ width: 14, height: 14, color: "#7878A0" }} />
        </button>

        {/* Notifications */}
        <NotificationBell />

        {/* IBM watsonx badge */}
        <div
          className="hidden md:flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-all hover:bg-purple/5"
          style={{
            background: "rgba(155,126,255,0.07)",
            border: "1px solid rgba(155,126,255,0.15)",
          }}
        >
          <Zap style={{ width: 11, height: 11, color: "#9B7EFF" }} />
          <span
            className="text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: "#9B7EFF" }}
          >
            IBM watsonx
          </span>
        </div>

        <UserButton
          appearance={{
            elements: { avatarBox: "h-7 w-7" },
          }}
        />
      </div>
    </div>
  );
}
